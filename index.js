;(function () {
  const laytpl = layui.laytpl
  /** @type {HTMLElement} */
  const randomPostElem = document.querySelector(".contain .contain-right .random-post")
    , postItemTmplElem = document.querySelector("#postItemTmpl")
    , expansionElem = document.querySelector(".expansion")
    , postCountElem = expansionElem.querySelector('.post-count')
    , tagCountElem = expansionElem.querySelector('.tag-count')
    , categoryCountElem = expansionElem.querySelector('.category-count')
    , nameElem = expansionElem.querySelector('.name')
    , excerptElem = expansionElem.querySelector('.excerpt')

  nameElem.innerText = dbJson.name
  excerptElem.innerText = dbJson.excerpt
  randomPostElem.addEventListener('click', event => {
    event.preventDefault()
    /** @type {HTMLHeadingElement} */
    const targetElement = event.target
    if (targetElement.tagName !== 'H2' || !targetElement.hasAttribute('data-url')) {return}
    window.open(targetElement.getAttribute('data-url'))
  })
  window.elemTypewriter(document.querySelector(".slogan>span"), dbJson.sloganList)
  // noinspection TypeScriptUMDGlobal
  initSqlJs({locateFile: () => "./static/sql/sql-wasm.wasm"}).then(function (SQL) {
    fetch("./database.db").then(res => res.arrayBuffer()).then(buf => {
      const db = new SQL.Database(new Uint8Array(buf))
      tagCountElem.innerText = db.exec("SELECT COUNT(*) FROM tag")[0].values[0] + ''
      postCountElem.innerText = db.exec("SELECT COUNT(*) FROM post")[0].values[0] + ''
      categoryCountElem.innerText = db.exec("SELECT COUNT(*) FROM category")[0].values[0] + ''
      const postRandom = db.exec(
        "SELECT post_id,cover,title,post.summary,created_at,category.name AS categoryName FROM post JOIN category ON post.category_id = category.category_id ORDER BY RANDOM() LIMIT 6")[0]
        .values.map(item => ({
          postId: item[0], cover: item[1], title: item[2], summary: item[3], categoryName: item[5],
          createdAt: timestampToYMdHM(item[4]),
          postUrl: postUrlHandler(item[4], item[0]),
        }))
      postRandom.forEach(item => {
        const tagNames = db.exec("SELECT t.name FROM tag_post tp JOIN tag t ON tp.tag_id = t.tag_id WHERE tp.post_id = ?", [item.postId])
        item['tagNameStr'] = ""
        if (tagNames && tagNames.length > 0) { item['tagNameStr'] = tagNames[0].values.join(",")}
        randomPostElem.insertAdjacentHTML("beforeend", laytpl(postItemTmplElem.innerHTML).render(item))
      })
    })
  })
})()