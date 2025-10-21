// tmpl/posts.js
;(() => {
  /** @type {HTMLElement} */
  const sidebarTocElem = document.querySelector('.contain>.sidebar-toc>div')
    , postMainElem = document.querySelector('.contain>.post-main')
    , postHeaderElem = document.querySelector('.contain>.post-main>.post-header')
    , postMetaElem = postHeaderElem.querySelector('.post-meta')
    , postMetaWordCountElem = postMetaElem.querySelector('span:nth-of-type(3)>span')
    , postContentElem = document.querySelector('.contain>.post-main>.post-content>div')
    , postSidebarTocBtnElem = document.querySelector('.contain>.sidebar-toc-btn')
    , sidebarAuthorElem = document.querySelector('.contain>.sidebar-author')
    , asideItemClockElem = sidebarAuthorElem.querySelector('.aside-item-clock')
    , asideRandomPostElem = sidebarAuthorElem.querySelector('.aside-random-post')
    , asideItemUserNameElem = sidebarAuthorElem.querySelector('.aside-item-author>.user span')
    , asideItemExcerptElem = sidebarAuthorElem.querySelector('.aside-item-author>.user p')
    , asideCountElem = sidebarAuthorElem.querySelector('.aside-item-author>.count')
    , postCountElem = asideCountElem.querySelector('.item:nth-of-type(1) .num')
    , categoryCountElem = asideCountElem.querySelector('.item:nth-of-type(2) .num')
    , tagCountElem = asideCountElem.querySelector('.item:nth-of-type(3) .num')
  {
    asideItemUserNameElem.textContent = dbJson.name
    asideItemExcerptElem.textContent = dbJson.excerpt
    asideItemClockElem.textContent = stableRunningTimeStr(dbJson.time)
    postMetaWordCountElem.textContent =
      postContentElem.innerText.replace(/\n/g, '').replace(/\s+/g, '').length.toString()
  }
  {
    postSidebarTocBtnElem.addEventListener('click', (event) => {
      event.preventDefault()
      document.querySelector('.contain>.sidebar-toc').classList.toggle('active')
    })
    asideRandomPostElem.addEventListener('click', (event) => {
      event.preventDefault()
      const targetElement = event.target
      if (targetElement.tagName !== 'H3' || !targetElement.hasAttribute('data-url')) {return}
      window.open(targetElement.getAttribute('data-url'))
    })
  }
  Vditor.preview(postContentElem, initMarkdown
      , {cdn: "/static/vditor", anchor: 0, theme: {current: 'light'}, hljs: {style: 'github-dark-dimmed'}})
    .then(() => {
      Vditor.outlineRender(postContentElem, sidebarTocElem)
      sidebarTocElem.querySelectorAll('span[data-target-id]').forEach(function (parEle) {
        parEle.querySelector('span').addEventListener('click', function (event) {
          event.preventDefault() // 阻止默认行为
          const tarEle = document.getElementById(parEle.getAttribute('data-target-id'))
          if (tarEle && tarEle.offsetTop !== postMainElem.scrollTop) {
            postMainElem.scrollTo({top: tarEle.offsetTop - 12, behavior: 'smooth'})
          }
        })
      })
    })
  // noinspection TypeScriptUMDGlobal
  initSqlJs({locateFile: () => "/static/sql/sql-wasm.wasm"}).then(function (SQL) {
    fetch("/database.db").then(res => res.arrayBuffer()).then(buf => {
      const db = new SQL.Database(new Uint8Array(buf))
      const countPost = db.exec('SELECT COUNT(*) FROM post')
        , countCategory = db.exec('SELECT COUNT(*) FROM category')
        , countTag = db.exec('SELECT COUNT(*) FROM tag')
        , randomPost = db.exec(
        'SELECT post_id,cover,c.name,title,p.summary,created_at FROM post p LEFT JOIN category c ON p.category_id= c.category_id ORDER BY RANDOM() LIMIT 1')
      if (countPost.length > 0) { postCountElem.textContent = countPost[0].values[0][0] + ''}
      if (countCategory.length > 0) {categoryCountElem.textContent = countCategory[0].values[0][0] + ''}
      if (countTag.length > 0) {tagCountElem.textContent = countTag[0].values[0][0] + ''}
      if (randomPost.length > 0) {
        const tempPost = randomPost[0].values.map(item => {
          const tagRes = db.exec("SELECT t.name FROM tag_post tp JOIN tag t ON tp.tag_id = t.tag_id WHERE tp.post_id = ?", [item[0]])
          let tagNameStr = ''
          if (tagRes.length > 0) {tagNameStr = tagRes[0].values.join(',')}
          return {
            postId: item[0], cover: item[1], categoryName: item[2], title: item[3], summary: item[4], createdAt: timestampToYMdHM(item[5]),
            postUrl: postUrlHandler(item[5], item[0]), tagNameStr: tagNameStr,
          }
        })
        const tempStr = `<img src="${ tempPost[0].cover }" alt="图" style="width:100px;height:100px;object-fit: cover;" onerror="this.onerror=null;this.src='/static/img/default-cover.png'">
    <h3 data-url="${ tempPost[0].postUrl }">${ tempPost[0].title }</h3><p>${ tempPost[0].summary }</p>
    <div>
      <span><i class="fa fa-calendar">&ensp;</i>${ tempPost[0].createdAt }</span>
      <span><i class="fa fa-th-large">&ensp;</i>${ tempPost[0].categoryName }</span>
      <span><i class="fa fa-tags">&ensp;</i>${ tempPost[0].tagNameStr }</span>
    </div>`
        asideRandomPostElem.insertAdjacentHTML('beforeend', tempStr)
      }
    })
  })
})()
