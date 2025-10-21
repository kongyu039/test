// z_test/post.js
;(function () {
  const form = layui.form, laytpl = layui.laytpl, xmSelect = layui.xmSelect, laypage = layui.laypage
  /** @type {Database} */
  let DB = null
  let pageNumber = 1
  const numberInputElem = document.querySelector('#numberInput')
    , countCategoryElem = document.querySelector('.contain-right .category-count')
    , countTagElem = document.querySelector('.contain-right .tag-count')
    , countPostElem = document.querySelector('.contain-right .post-count')
    , categoryElem = document.querySelector('.contain-right .category')
    , tagElem = document.querySelector('.contain-right .tag')
    , postYearCountElem = document.querySelector('.contain-right .timeline>span>i')
    , timelineContentElem = document.querySelector('.contain-right .timeline .timeline-content')
    , announcementContentElem = document.querySelector('.contain-left .announcement .announcement-content')
    , formCategoryElem = document.querySelector('.contain-left .search-form .category')
    , formTagsElem = document.querySelector('.contain-left .search-form .tags')
    , postListElem = document.querySelector('.contain-left .post-list')
    , postPageElem = document.querySelector('.contain-left .post-page')
    , postItemTmplElem = document.querySelector("#postItemTmpl")
    , nameElem = document.querySelector('.contain-right .name')
    , excerptElem = document.querySelector('.contain-right .excerpt')
  nameElem.textContent = dbJson.name
  excerptElem.textContent = dbJson.excerpt
  announcementContentElem.textContent = dbJson.announcement;
  numberInputElem.value = new Date().getFullYear()
  numberInputElem.addEventListener('input', function () {
    const tempNum = Number(this.value)
    if (DB) { timeLineRender(tempNum.toString())}
  })
  timelineContentElem.addEventListener('click', function (event) {
    event.preventDefault()
    const closest = event.target.closest('div[data-url]')
    if (closest) {window.open(closest.dataset.url)}
  })
  postListElem.addEventListener('click', event => {
    event.preventDefault()
    /** @type {HTMLHeadingElement} */
    const targetElement = event.target
    if (targetElement.tagName !== 'H2' || !targetElement.hasAttribute('data-url')) {return}
    window.open(targetElement.getAttribute('data-url'))
  })
  // noinspection TypeScriptUMDGlobal
  initSqlJs({locateFile: () => "/static/sql/sql-wasm.wasm"}).then(function (SQL) {
    fetch("/database.db").then(res => res.arrayBuffer()).then(buf => {
      DB = new SQL.Database(new Uint8Array(buf))
      countTotalRender() // 统计数量
      categoryAndTagRender() // 分类和标签渲染
      timeLineRender(new Date().getFullYear().toString()) // 时间轴渲染
      searchFormCategoryRender() // 搜索表格类别渲染
      searchFormTagsRender() // 搜索表格标签渲染
      const postData = searchFormFieldData() // 获取post_data
      postListRender(postData)
    })
  })

  /** 统计数量 tag,category,post */
  function countTotalRender() {
    countCategoryElem.textContent = DB.exec("SELECT COUNT(*) FROM category")[0].values[0]
    countTagElem.textContent = DB.exec("SELECT COUNT(*) FROM tag")[0].values[0]
    countPostElem.textContent = DB.exec("SELECT COUNT(*) FROM post")[0].values[0]
  }

  /** 分类和标签渲染 */
  function categoryAndTagRender() {
    const categoryList = DB.exec(
        "SELECT category.name,COUNT(post.post_id) FROM category LEFT JOIN post ON post.category_id = category.category_id GROUP BY category.name")[0].values,
      tagList = DB.exec(
        "SELECT tag.name,COUNT(tag_post.post_id) FROM tag LEFT JOIN tag_post ON tag.tag_id = tag_post.tag_id GROUP BY tag.name")[0].values
    categoryList.forEach(category => {
      categoryElem.insertAdjacentHTML('afterbegin', `<span>${ category[0] }<i>${ category[1] }</i></span>`)
    })
    tagList.forEach(tag => {tagElem.insertAdjacentHTML('afterbegin', `<span>${ tag[0] }<i>${ tag[1] }</i></span>`)})
  }

  /**
   * 时间轴渲染
   * @param {string} year 年
   */
  function timeLineRender(year) {
    const timeline = DB.exec("SELECT post_id,title,created_at FROM post WHERE STRFTIME('%Y', DATETIME(created_at/1000, 'unixepoch')) = ?",
      [year],
    )
    if (timeline.length > 0) {
      postYearCountElem.textContent = timeline[0].values.length + ''
    } else {postYearCountElem.textContent = "0"}
    timelineContentElem.innerHTML = ""
    if (timeline.length === 0) { return}
    timeline[0].values.map(item => ({
      postId: item[0], title: item[1], created: timestampToYMd(item[2]),
      postUrl: postUrlHandler(item[2], item[0]),
    })).forEach(item => {
      timelineContentElem.insertAdjacentHTML('beforeend',
        `<div data-url="${ item['postUrl'] }"><h3>${ item['created'] }</h3><h3>${ item['title'] }</h3></div>`,
      )
    })
  }

  /** 搜索表格类别渲染 */
  function searchFormCategoryRender() {
    const selectFormElem = formCategoryElem.querySelector('select')
    selectFormElem.insertAdjacentHTML("beforeend", '<option value="" selected>全部分类</option>')
    DB.exec("SELECT category_id,name FROM category")[0].values.forEach(item => {
      selectFormElem.insertAdjacentHTML("beforeend", `<option value="${ item[0] }">${ item[1] }</option>`)
    })
    form.render(null, 'search-form')
    form.on('submit(search-submit)', function (data) {
      const {field} = data
      if (!field) {return false}
      pageNumber = 1
      const postData = searchFormFieldData(field)
      postListRender(postData)
      return false
    })
  }

  /** 搜索表格标签渲染 */
  function searchFormTagsRender() {
    const data = DB.exec("SELECT tag_id,name FROM tag")[0].values.map(item => ({name: item[1], value: item[0]}))
    xmSelect.render({
      el: formTagsElem, name: "tagIds", filterable: true, paging: true, size: "large", pageSize: 5, autoRow: false,
      toolbar: {show: true, list: ["ALL", "CLEAR"]}, data: data,
    })
  }

  /**
   * 通过field获取结果data数组
   * @param field
   */
  function searchFormFieldData(field) {
    if (field != null && field['categoryId'].length === 0) {field['categoryId'] = undefined}
    const title = field?.title.replace(/\s/g, '').split('').join("%"),
      summary = field?.summary.replace(/\s/g, '').trim().split('').join("%"), categoryId = Number(field?.categoryId),
      tagIds = field?.tagIds.split(',').filter(Boolean) || [], pageSize = 10
    const sqlPost =
      `SELECT p.post_id postId, p.cover, p.title, p.summary, p.created_at createdAt, p.is_top isTop, c.name categoryName
       FROM post p
                LEFT JOIN category c ON p.category_id = c.category_id
                LEFT JOIN tag_post tp ON p.post_id = tp.post_id
       WHERE TRUE `
      + `${ !title ? "" : "\nAND p.title LIKE '%" + title + "%'" }`
      + `${ !summary ? "" : "\nAND p.summary LIKE '%" + summary + "%'" }`
      + `${ categoryId >= 0 ? "\nAND p.category_id = " + categoryId : "" }`
      + `${ tagIds.length > 0 ? "\nAND tp.tag_id IN (" + tagIds.join(',') + ")" : "" }`
      + `\nGROUP BY p.post_id`
      + `${ tagIds.length > 0 ? "\nHAVING COUNT(DISTINCT tp.tag_id) = " + tagIds.length : "" }`
      + `\nORDER BY p.is_top DESC`
    const postCount = DB.exec(`SELECT COUNT(*) FROM (${ sqlPost }) `)
    const post = DB.exec(sqlPost + `\nLIMIT ${ pageSize } OFFSET ${ pageNumber - 1 } * ${ pageSize }`)
    if (post.length === 0) { return {count: 0, posts: []} }
    return {
      count: postCount[0].values[0], posts: post[0].values.map(item => {
        const sqlTag = "SELECT t.name FROM tag t LEFT JOIN tag_post tp ON t.tag_id = tp.tag_id WHERE tp.post_id = ?"
        const tag = DB.exec(sqlTag, [item[0]])
        const tags = tag.length > 0 ? tag[0].values.map(item => (item[0])) : []
        return {
          postId: item[0], cover: item[1], title: item[2], summary: item[3], isTop: item[5], categoryName: item[6],
          tagNameStr: tags.join(','), tags: tags, createdAt: timestampToYMdHM(item[4]),
          postUrl: postUrlHandler(item[4], item[0]),
        }
      }),
    }
  }

  /**
   * 通过post数据 渲染 postList
   * @param {{count:number,posts:[]}} data
   */
  function postListRender(data) {
    const {count, posts} = data
    laypage.render({
      elem: postPageElem, groups: 3, count: count, jump(obj, first) {
        postListElem.innerHTML = ""
        if (first) {
          posts.forEach(item => {
            postListElem.insertAdjacentHTML('beforeend', laytpl(postItemTmplElem.innerHTML).render(item))
          })
        } else {
          const field = layui.form.val("search-form")
          pageNumber = obj.curr
          const {posts} = searchFormFieldData(field)
          posts.forEach(item => {
            postListElem.insertAdjacentHTML('beforeend', laytpl(postItemTmplElem.innerHTML).render(item))
          })
        }
      },
    })
  }
})()