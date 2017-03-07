var isMobile = false;
var hostname = window.location.hostname;
var port = 8080;
var defaultUser = "root";
var applicationPINVar = "applicationPIN";
var selectedPrinterVar = "selectedPrinter";
var serverNameVar = "serverName";
var safetiesOnVar = "safetiesOn";
var loginPage = "/login.html";
var printerStatusPage = "/printerStatus.html";
var locationificator_initialised = false;

function checkForMobileBrowser()
{
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
            || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)))
    {
        isMobile = true;
    }
}

function goToPrinterStatusPage()
{
    var enteredPIN = localStorage.getItem(applicationPINVar);
    if (enteredPIN !== null && enteredPIN !== "")
    {
        var base64EncodedCredentials = $.base64.encode(defaultUser + ":" + enteredPIN);
        $.ajax({
            url: 'http://' + window.location.hostname + ':8080' + printerStatusPage,
            cache: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + base64EncodedCredentials);
            },
            type: 'GET',
            success: function (data, textStatus, jqXHR) {
                location.href = 'http://' + window.location.hostname + ':8080' + printerStatusPage;
            },
            error: function (data, textStatus, jqXHR) {
                logout();
            }
        });
    } else
    {
        logout();
    }
}

function logout()
{
    localStorage.setItem(applicationPINVar, "");
    location.href = 'http://' + hostname + ':' + port + loginPage;
}

function sendGetCommandToRoot(service, successCallback, errorCallback, dataToSend)
{
    sendCommandToRoot('GET', service, successCallback, errorCallback, dataToSend);
}
function sendPostCommandToRoot(service, successCallback, errorCallback, dataToSend)
{
    sendCommandToRoot('POST', service, successCallback, errorCallback, dataToSend);
}

function sendCommandToRoot(requestType, service, successCallback, errorCallback, dataToSend)
{
    var printerURL = "http://" + hostname + ":" + port + "/api/" + service + "/";
    var base64EncodedCredentials = $.base64.encode(defaultUser + ":" + localStorage.getItem(applicationPINVar));

    $.ajax({
        url: printerURL,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + base64EncodedCredentials);
        },
        contentType: "application/json", // send as JSON
        type: requestType,
//        dataType: 'json',
        data: JSON.stringify(dataToSend)
    }).success(function (data, textStatus, jqXHR)
    {
        if (successCallback !== null)
        {
            successCallback(data);
        }
    }).error(function (jqXHR, textStatus, errorThrown) {
        if (errorCallback !== null)
        {
            errorCallback(textStatus);
        }
    });
}

function submitFormToRoot(service, successCallback, errorCallback, formData)
{
    var printerURL = "http://" + hostname + ":" + port + "/api/" + service + "/";
    var base64EncodedCredentials = $.base64.encode(defaultUser + ":" + localStorage.getItem(applicationPINVar));

    $.ajax({
        url: printerURL,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + base64EncodedCredentials);
        },
        type: 'POST',
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    }).success(function (data, textStatus, jqXHR)
    {
        if (successCallback !== null)
        {
            successCallback(data);
        }
    }).error(function (jqXHR, textStatus, errorThrown) {
        if (errorCallback !== null)
        {
            errorCallback(textStatus);
        }
    });
}

function refreshStatusTable()
{
    $("table#printer-status")
            .table("refresh")
            // Trigger if the new injected markup contain links or buttons that need to be enhanced
            .trigger("create");
}

function updateLocalisation()
{
    if (locationificator_initialised)
    {
        $('.localised').each(function ()
        {
            $(this).localize();
        });

        $(".language-selector").val(i18next.language);
    }
}

function updateHeaderi18String(i18nString)
{
    $('#pageTitle').val(i18nString);
}

function selectLanguage(language)
{
    i18next.changeLanguage(language, (err, t) => {
        updateLocalisation();
    });
}

$(document).ready(function () {
    i18next.use(i18nextBrowserLanguageDetector)
            .use(i18nextXHRBackend)
            .init({
                debug: true,
                fallbackLng: 'en',
                backend: {
                    loadPath: '/locales/{{lng}}/translation.json'
                }
            }, function (t) {
                jqueryI18next.init(i18next, $, {
                    tName: 't', // --> appends $.t = i18next.t
                    i18nName: 'i18n', // --> appends $.i18n = i18next
                    handleName: 'localize', // --> appends $(selector).localize(opts);
                    selectorAttr: 'data-i18n', // selector for translating elements
                    targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if diffrent then itself)
                    optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
                    useOptionsAttr: false, // see optionsAttr
                });
                locationificator_initialised = true;
                updateLocalisation();

                checkForMobileBrowser();

                if (typeof page_initialiser === "function")
                {
                    page_initialiser();
                    updateLocalisation();
                }
            });
});