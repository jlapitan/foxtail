(function (ga) {
  'use strict';

  // !! this script assumes only one signup form per page !!

  var newsletterForm = document.getElementById('newsletter-form');
  var newsletterWrapper = document.getElementById('newsletter-content');
  if (newsletterForm) {
    var blogName = newsletterForm.getAttribute('data-blog');
  }

  // handle errors
  var errorArray = [];
  var newsletterErrors = document.getElementById('newsletter-errors');
  function newsletterError() {
    var errorList = document.createElement('ul');

    if (errorArray.length) {
      for (var i = 0; i < errorArray.length; i++) {
        var item = document.createElement('li');
        item.appendChild(document.createTextNode(errorArray[i]));
        errorList.appendChild(item);
      }
    } else {
      // no error messages, forward to server for better troubleshooting
      newsletterForm.setAttribute('data-skip-xhr', true);
      newsletterForm.submit();
    }

    newsletterErrors.appendChild(errorList);
    newsletterErrors.style.display = 'block';
  }

  // XHR subscribe; handle errors; display thanks message on success.
  function newsletterSubscribe(evt) {
    var skipXHR = newsletterForm.getAttribute('data-skip-xhr');
    if (skipXHR) {
      return true;
    }

    // submit and display thank you message
    var submitThanks = document.getElementById('newsletter-thanks');
    var submitContent = document.getElementById('newsletter-content');
    evt.preventDefault();
    evt.stopPropagation();
    submitContent.style.display = 'none';
    submitThanks.style.display = 'block';

    // new submission, clear old errors
    errorArray = [];
    newsletterErrors.style.display = 'none';
    while (newsletterErrors.firstChild) {
      newsletterErrors.removeChild(newsletterErrors.firstChild);
    }

    var email = document.getElementById('email').value;
    var newsletter = document.getElementById('newsletters').value;
    var privacy = document.querySelector('input[name="privacy"]:checked') ? '&privacy=true' : '';
    var lang = document.getElementById('language').value;
    var fmt = document.querySelector('input[name="fmt"]:checked').value;
    var sourceUrl = document.getElementById('source_url').value;
    var params = 'email=' + encodeURIComponent(email) +
      '&newsletters=' + newsletter +
      privacy +
      '&lang=' + lang +
      '&fmt=' + fmt +
      '&source_url=' + sourceUrl;

    var xhr = new XMLHttpRequest();

    xhr.onload = function (r) {
      if (r.target.status >= 200 && r.target.status < 300) {
        // response is null if handled by service worker
        if (response === null) {
          newsletterError(new Error());
          return;
        }
        var response = r.target.response;
        if (response.success === true) {
          newsletterWrapper.style.display = 'none';

          // Count signups in Google Analytics
          if (typeof gtag === 'function') {
            ga('send', {
              hitType: 'event',
              eventAction: 'newsletter subscription',
              eventCategory: blogname + ' Interactions',
              eventLabel: newsletter,
            });

          }
        }
        else {
          if (response.errors) {
            for (var i = 0; i < response.errors.length; i++) {
              errorArray.push(response.errors[i]);
            }
          }
          newsletterError(new Error());
        }
      }
      else {
        newsletterError(new Error());
      }
    };

    xhr.onerror = function (e) {
      newsletterError(e);
    };

    var url = newsletterForm.getAttribute('action');

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.timeout = 5000;
    xhr.ontimeout = newsletterError;
    xhr.responseType = 'json';
    xhr.send(params);

    return false;
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', newsletterSubscribe, false);
  }
})();
