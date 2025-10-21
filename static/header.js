// z_test/static/header.js
window.addEventListener('DOMContentLoaded', function () {
  const headerElem = document.querySelector(".header")
  headerElem.addEventListener('click', event => {
    event.preventDefault()
    /** @type {HTMLElement} */
    const targetElement = event.target
    if (!targetElement.dataset['event']) return
    switch (targetElement.dataset['event']) {
      case 'home':
        location.href = dbJson.homeUrl
        break
      case 'post':
        location.href = "/post.html"
        break
      case 'about':
        location.href = dbJson.aboutUrl
        break
      case 'site':
        location.href = dbJson.siteUrl
        break
    }
  })
})