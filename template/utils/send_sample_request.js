define([
  'jquery'
], function($) {

  var initDynamic = function() {
      // Button send
      $(".sample-request-send").off("click");
      $(".sample-request-send").on("click", function(e) {
          e.preventDefault();
          var $root = $(this).parents("article");
          var group = $root.data("group");
          var name = $root.data("name");
          var version = $root.data("version");
          sendSampleRequest(group, name, version, $(this).data("sample-request-type"));
      });

      // Button clear
      $(".sample-request-clear").off("click");
      $(".sample-request-clear").on("click", function(e) {
          e.preventDefault();
          var $root = $(this).parents("article");
          var group = $root.data("group");
          var name = $root.data("name");
          var version = $root.data("version");
          clearSampleRequest(group, name, version);
      });
  }; // initDynamic

  function sendSampleRequest(group, name, version, type)
  {
      var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

      // Optional header
      var header = {};
      $root.find(".sample-request-header:checked").each(function(i, element) {
          var group = $(element).data("sample-request-header-group-id");
          $root.find("[data-sample-request-header-group=\"" + group + "\"]").each(function(i, element) {
            var key = $(element).data("sample-request-header-name");
            var value = element.value;
            if ( ! element.optional && element.defaultValue !== '') {
                value = element.defaultValue;
            }
            header[key] = value;
          });
      });

      // create JSON dictionary of parameters
      var param = {};
      var paramType = {};
      $root.find(".sample-request-param:checked").each(function(i, element) {
          var group = $(element).data("sample-request-param-group-id");
          $root.find("[data-sample-request-param-group=\"" + group + "\"]").each(function(i, element) {
            var key = $(element).data("sample-request-param-name");
            var value = element.value;
            if ( ! element.optional && element.defaultValue !== '') {
                value = element.defaultValue;
            }
            param[key] = value;
            paramType[key] = $(element).next().text();
          });
      });

      // grab user-inputted URL
      var url = $root.find(".sample-request-url").val();

      // Insert url parameter
      var pattern = pathToRegexp(url, null);
      var matches = pattern.exec(url);
      for (var i = 1; i < matches.length; i++) {
          var key = matches[i].substr(1);
          if (param[key] !== undefined) {
              url = url.replace(matches[i], encodeURIComponent(param[key]));

              // remove URL parameters from list
              delete param[key];
          }
      } // for

      $root.find(".sample-request-response").fadeTo(250, 1);
      $root.find(".sample-request-response-json").html("Loading...");
      refreshScrollSpy();

      _.each( param, function( val, key ) {
          var t = paramType[ key ].toLowerCase();
          if ( t === 'object' || t === 'array' ) {
              try {
                  param[ key ] = JSON.parse( val );
              } catch (e) {
              }
          }
      });

      // send AJAX request, catch success or error callback
      var ajaxRequest = {
          url        : url,
          dataType   : 'json',
          contentType: 'application/json',
          headers    : header,
          type       : type.toUpperCase(),
          success    : displaySuccess,
          error      : displayError
      };

      if (type === 'get') {
           ajaxRequest.url = url + paramToQueryParms(param),
           ajaxRequest.dataType = "text";
           ajaxRequest.contentType = "text/plain";
       } else {
           if ( ! $.isEmptyObject(param)) {
               ajaxRequest.data = JSON.stringify(param);
           }
       }

      $.ajax(ajaxRequest);

      function paramToQueryParms(param) {
        var sendString = [];
        for (var k in param)
        {
          if(param[k] != null && param[k] != "")
          {
            var datum = param[k];
            if (Object.prototype.toString.call(datum) === '[object Array]')
            {
              for (var i = 0, j = datum.length; i < j; i++)
              {
                sendString.push(k + '[]=' + datum[i]);
              }
            }
            else
            {
              sendString.push(k + '=' + datum);
            }
          }
        }
        sendString = sendString.join('&');

        return sendString != "" ? "?"+sendString : "";
      }


      function displaySuccess(data, status, jqXHR) {
          var jsonResponse;
          try {
              jsonResponse = JSON.parse(jqXHR.responseText);
              jsonResponse = JSON.stringify(jsonResponse, null, 4);
          } catch (e) {
              jsonResponse = data;
          }
          $root.find(".sample-request-response-json").html(jsonResponse);
          refreshScrollSpy();
      };

      function displayError(jqXHR, textStatus, error) {
          var message = "Error " + jqXHR.status + ": " + error;
          var jsonResponse;
          try {
              jsonResponse = JSON.parse(jqXHR.responseText);
              jsonResponse = JSON.stringify(jsonResponse, null, 4);
          } catch (e) {
              jsonResponse = escape(jqXHR.responseText);
          }

          if (jsonResponse)
              message += "<br>" + jsonResponse;

          // flicker on previous error to make clear that there is a new response
          if($root.find(".sample-request-response").is(":visible"))
              $root.find(".sample-request-response").fadeTo(1, 0.1);

          $root.find(".sample-request-response").fadeTo(250, 1);
          $root.find(".sample-request-response-json").html(message);
          refreshScrollSpy();
      };
  }

  function clearSampleRequest(group, name, version)
  {
      var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

      // hide sample response
      $root.find(".sample-request-response-json").html("");
      $root.find(".sample-request-response").hide();

      // reset value of parameters
      $root.find(".sample-request-param").each(function(i, element) {
          element.value = "";
      });

      // restore default URL
      var $urlElement = $root.find(".sample-request-url");
      $urlElement.val($urlElement.prop("defaultValue"));

      refreshScrollSpy();
  }

  function refreshScrollSpy()
  {
      $('[data-spy="scroll"]').each(function () {
          $(this).scrollspy("refresh");
      });
  }

  function escapeHtml(str) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
  }

  /**
   * Exports.
   */
  return {
      initDynamic: initDynamic
  };

});
