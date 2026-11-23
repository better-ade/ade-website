// ADE website: "Ask for an early preview" opens an email.
// The address is not written in any page, and not in one piece here either: this builds the mailto link when a link
// marked data-preview-mail is clicked, and the browser then follows it. Without JavaScript those links keep the
// address they were built with, the GitHub issue form.
(function () {
  "use strict";

  var SUBJECT = "ADE Computer early preview";
  var BODY = [
    "Hello,",
    "",
    "I would like an early preview of ADE Computer.",
    "",
    "What would you use it for?",
    "Team size:",
    "Platform (macOS or Linux):",
    "",
  ].join("\n");

  function mailto() {
    var to = ["preview", ["ardata", "tech"].join(".")].join("@");
    return "mailto:" + to + "?subject=" + encodeURIComponent(SUBJECT) + "&body=" + encodeURIComponent(BODY);
  }

  // One listener for the page: it also covers a click on something inside the link, such as the button's arrow.
  document.addEventListener("click", function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[data-preview-mail]") : null;
    if (link) link.setAttribute("href", mailto());
  });
})();
