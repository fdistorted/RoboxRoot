// Note "&nbsp;" (non-breaking space) is used to stop
// empty lines from collapsing to zero height.
var nbsp = '&nbsp;';

var profileIconMap = 
{
    'CUSTOM': 'Icon-ProfileCustom.svg',
	'DRAFT': 'Icon-ProfileDraft.svg',
    'FINE': 'Icon-ProfileFine.svg',
    'NORMAL': 'Icon-ProfileNormal.svg'
};

var reelIconMap = 
{
    'CUSTOM': 'Icon-Home-CustomReel.svg',
    'NONE': 'Icon-Home-NoReel.svg',
	'SMART': 'Icon-Home-SmartReel.svg',
    'UNKNOWN': 'Icon-Home-UnknownReel.svg'
};

var homeStatusText = "";
var homePrinterName = "";
var homeWebColourString = "";
var homeStatusEnumValue = "";
var homeTotalDurationSeconds = 0;
var homeEtcSeconds = 0;
var homeTimeElapsed = 0;

// Debounce flag to prevent buttons from being clicked multiple times.
// Flag is set when a button is pressed and cleared when the button status is refreshed.
var homeDebounceFlag = true;

function updateNameStatus(nameData)
{
    var machineDetails = getMachineDetails();
    
    $('#'+ machineDetails['icon']).removeClass('hidden');
    $('#idle-image').attr('src', imageRoot + machineDetails['idle-icon'])
    $('#machine-model').html(i18next.t(machineDetails['model']));
    $('#machine-name').html(nameData.printerName);

    // Set the colour of the machine box to be the LED colours.
    // Set the colour of the machine icon to a complimentary colour
    // so that it is visible.
    homeWebColourString = nameData.printerWebColourString;
    $('#machine-icon').css('background-color', nameData.printerWebColourString);
    var backgroundCol = $('#machine-icon').css('background-color');
    var compCol = getComplimentaryOption(backgroundCol, "rgba(0,0,0,0.7)", "rgba(255,255,255,0.7)");
    $('.robox-icon').css({'color' : compCol, 'fill' : compCol});
}

function updateFilamentStatus(materialData, filamentIndex)
{
    var typeValue = null;
    var descriptionValue = null;
    var colourValue = "White";
    var showLoaded = false;
    var reelIcon = null;

    if (materialData.attachedFilamentNames !== null)
    {
        showLoaded = materialData.materialLoaded[filamentIndex];
        if (materialData.attachedFilamentMaterials.length > filamentIndex)
        {
            if (materialData.attachedFilamentNames[filamentIndex] !== null)
            {
                typeValue = materialData.attachedFilamentMaterials[filamentIndex];
                descriptionValue = materialData.attachedFilamentNames[filamentIndex];
                colourValue = materialData.attachedFilamentWebColours[filamentIndex];
                if (materialData.attachedFilamentCustomFlags[filamentIndex])
                    reelIcon = reelIconMap['CUSTOM'];
                else
                    reelIcon = reelIconMap['SMART'];
            }
            else
            {
                if (showLoaded)
                {
                    descriptionValue = i18next.t("unknown-filament");
                    reelIcon = reelIconMap['UNKNOWN'];
                }
                else
                {
                    descriptionValue = i18next.t("no-filament");
                    reelIcon = reelIconMap['NONE'];
                }
                colourValue = 'White';
            }
        }
    }
    
    var filamentName = 'filament-' + (filamentIndex + 1);
    var typeField = '#' + filamentName + '-type';
    var remainingField = '#' + filamentName + '-remaining';
    var descriptionField = '#' + filamentName + '-description';
    var colourField = '#' + filamentName + '-colour';
    var reelImage = '#' + filamentName + '-icon';
    var ejectButton = '#' + filamentName + '-eject';

    if (typeValue !== null)
    {
        $(typeField).html(typeValue)
        if (descriptionValue !== null)
        {
            $(descriptionField).html(descriptionValue);
            $(remainingField).html(nbsp);
            $(colourField).html(nbsp);
        }
        else
        {
            $(descriptionField).html(nbsp);
            $(remainingField).html(nbsp);
            $(colourField).html(nbsp);
        }
    }
    else
    {
        $(typeField).html(nbsp)
        $(descriptionField).html(nbsp);
        $(remainingField).html(nbsp);
        $(colourField).html(nbsp);
    }

    $(reelImage).attr('src', imageRoot + reelIcon)
               
    if (showLoaded)
        $(ejectButton).show();
    else
        $(ejectButton).hide();
}

function eject(materialNumber)
{
    var selectedPrinter = localStorage.getItem(selectedPrinterVar)
    sendPostCommandToRoot(selectedPrinter + '/remoteControl/ejectFilament', null, null, materialNumber + 1);
	getStatusData(selectedPrinter, '/printJobStatus', updatePrintJobStatus)
	getStatusData(selectedPrinter, '/materialStatus', updateMaterialStatus)
}

function updateFilamentEjectStatus(materialData)
{
    var enableEject1Button = false;
    var enableEject2Button = false;

    if (materialData.attachedFilamentNames !== null && materialData.canEjectFilament !== null)
    {
        enableEject1Button = (materialData.canEjectFilament.length > 0 && materialData.canEjectFilament[0] === true);
        enableEject2Button = (materialData.canEjectFilament.length > 1 && materialData.canEjectFilament[1] === true);
    }
    
    if (enableEject1Button)
    {
        $('#filament-1-eject').removeClass('disabled');
        $('#filament-1-eject').on('click', function() { eject(0); });
    } else
    {
        $('#filament-1-eject').addClass('disabled');
        $('#filament-1-eject').on('click');
    }

    if (enableEject2Button)
    {
        $('#filament-2-eject').removeClass('disabled');
        $('#filament-2-eject').on('click', function() { eject(1); });
    } else
    {
        $('#filament-2-eject').addClass('disabled');
        $('#filament-2-eject').on('click');
    }
    $('.eject-button.disabled').css('background-color', 'rgba(0,0,0,0)')
}

function updateMaterialStatus(materialData)
{
    updateFilamentStatus(materialData, 0);
    updateFilamentStatus(materialData, 1);
    updateFilamentEjectStatus(materialData);
}

function updateHeadStatus(headData)
{
    $('#bed-temp').html(headData.bedTemperature + '\xB0' + 'C');
    $('#ambient-temp').html(headData.ambientTemperature + '\xB0' + 'C');
    var nozzle1Temperature = nbsp;
    var nozzle2Temperature = nbsp;
    if (headData.nozzleTemperature)
    {
        // For some curious reason, the nozzle temperature indices are swapped.
        var nHeaters = headData.nozzleTemperature.length;
        if (nHeaters > 0 && headData.nozzleTemperature[nHeaters - 1] !== null)
        {
            nozzle1Temperature = headData.nozzleTemperature[nHeaters - 1] + '\xB0' + 'C';
        }
        if (headData.nozzleTemperature.length > 1)
        {
            if (headData.nozzleTemperature[0] !== null)
                nozzle2Temperature = headData.nozzleTemperature[0] + '\xB0' + 'C';
        }
    }
        
    $('#nozzle-1-temp').html(nozzle1Temperature);
    $('#nozzle-2-temp').html(nozzle2Temperature);
    
    var numberOfNozzleHeaters = 0;
    if (headData.nozzleTemperature !== null)
    {
        numberOfNozzleHeaters = headData.nozzleTemperature.length;
    }

    switch (numberOfNozzleHeaters)
    {
        case 0:
            $('#nozzle-1-temp').parent().addClass("dimmed-section");
            $('#nozzle-2-temp').parent().addClass("dimmed-section");
            break;
        case 1:
            $('#nozzle-1-temp').parent().removeClass("dimmed-section");
            $('#nozzle-2-temp').parent().addClass("dimmed-section");
            break;
        case 2:
            $('#nozzle-1-temp').removeClass("dimmed-section");
            $('#nozzle-2-temp').removeClass("dimmed-section");
            break;
    }
}

function updatePrintJobStatus(printJobData)
{
    homeStatusText = printJobData.printerStatusString;
    homeStatusEnumValue = printJobData.printerStatusEnumValue;
    homeTotalDurationSeconds = printJobData.totalDurationSeconds;
    homeEtcSeconds = printJobData.etcSeconds;
    homeTimeElapsed = printJobData.totalDurationSeconds - printJobData.etcSeconds;

    if (!printJobData.printerStatusEnumValue.match("^IDLE"))
    {
        $('#idle-row').addClass('hidden');
        $('#job-row').removeClass('hidden');
        $('#progress-row').removeClass('hidden');
        if (printJobData.printJobName == null)
            $('#job-name').html(nbsp);
        else
            $('#job-name').html(printJobData.printJobName);
        $('#job-created').html(nbsp);
        if (printJobData.totalDurationSeconds == null || printJobData.totalDurationSeconds <= 0)
            $('#job-duration').html(nbsp);
        else
            $('#job-duration').html(secondsToHM(printJobData.totalDurationSeconds));
        if (printJobData.printJobSettings == null)
            $('#job-profile').html(nbsp);
        else
            $('#job-profile').html(secondsToHM(printJobData.printJobSettings));
        if (printJobData.printJobProfile == null)
            $('#job-background').css('background-image', null);
        else
        {
            var profileIcon = profileIconMap[printJobData.printJobProfile];
            if (profileIcon == null)
                profileIcon = profileIconMap['CUSTOM'];
            $('.rbx-home-job-details').css('background-image', 'url("' + imageRoot + profileIcon + '")');
        }
        updateJobStatusFields('#status-text', '#etc-text', '#progress-bar', printJobData)
    }
    else
    {
        $('#job-row').addClass('hidden');
        $('#progress-row').addClass('hidden');
        $('#idle-row').removeClass('hidden');
    }
}

function pausePrint()
{
    if (homeDebounceFlag !== true)
    {
	    var selectedPrinter = localStorage.getItem(selectedPrinterVar);
        sendPostCommandToRoot(selectedPrinter + "/remoteControl/pause", null, null, null);
	    getStatusData(selectedPrinter, '/printJobStatus', updatePrintJobStatus)
	    getStatusData(selectedPrinter, '/controlStatus', updateControlStatus)
    }
}

function resumePrint()
{
    if (homeDebounceFlag !== true)
    {
        var selectedPrinter = localStorage.getItem(selectedPrinterVar);
        sendPostCommandToRoot(selectedPrinter + "/remoteControl/resume", null, null, null);
        getStatusData(selectedPrinter, '/printJobStatus', updatePrintJobStatus)
        getStatusData(selectedPrinter, '/controlStatus', updateControlStatus)
    }
}

function cancelPrint()
{
    if (homeDebounceFlag !== true)
    {
        cancelAction();
        var selectedPrinter = localStorage.getItem(selectedPrinterVar);
        getStatusData(selectedPrinter, '/printJobStatus', updatePrintJobStatus)
        getStatusData(selectedPrinter, '/controlStatus', updateControlStatus)
        homeDebounceFlag = true;
    }
}

function updateControlStatus(controlData)
{
    if (controlData.canPause === true)
    {
        $('#pause-resume-button').removeClass("disabled")
                                 .on('click', pausePrint);
        $('#pause-resume-button img').attr('src', imageRoot + 'OldIcons/Icon-Pause-B.svg');
    } else if (controlData.canResume === true)
    {
        $('#pause-resume-button').removeClass("disabled")
                                 .on('click', resumePrint);
        $('#pause-resume-button img').attr('src', imageRoot + 'OldIcons/Icon-Play-B.svg');
    }
    else
    {
        $('#pause-resume-button').addClass("disabled");
        $('#pause-resume-button').on('click');
        $('#pause-resume-image').attr('src', imageRoot + 'OldIcons/Icon-Pause-B.svg');
    }
    
    if (controlData.canCancel === true)
    {
        $('#cancel-button').removeClass("disabled");
        $('#cancel-button').on('click', cancelPrint);
    }
    else
    {
        $('#cancel-button').addClass("disabled");
        $('#cancel-button').on('click');
    }
    
    homeDebounceFlag = false;
}

function clearActiveErrors()
{
    var pr = localStorage.getItem(selectedPrinterVar);

    if (pr !== null)
    {
        sendPostCommandToRoot(pr + '/remoteControl/clearErrors',
                function (data)
                {
                    $('#active-error-dialog').modal('hide');
                },
                goToPrinterStatusPage,
                null);
    }
}

function handleActiveErrors(activeErrorData)
{
    if (activeErrorData.activeErrors !== null &&
	    activeErrorData.activeErrors.length > 0)
    {
        $('#error-text').val(activeErrorData.activeErrors[0]);
        $('#clear-error-button').on('click', clearActiveErrors);
        $('#active-error-dialog').modal('show');
    }
    else
    {
        $('#active-error-dialog').modal('hide');
    }
}

function updateHomeData(printerData)
{
    localStorage.setItem(printerTypeVar, printerData.printerTypeCode);
    updateNameStatus(printerData);
    updateFilamentStatus(printerData, 0);
    updateFilamentStatus(printerData, 1);
    updateFilamentEjectStatus(printerData);
    updateHeadStatus(printerData);
    updatePrintJobStatus(printerData);
    updateControlStatus(printerData);
    currentPrinterData = printerData;
}

function resolvePrinterID(printerID)
{
    if (printerID !== null)
        return printerID;
    else
        return localStorage.getItem(selectedPrinterVar);
}

function getStatusData(printerID, statusName, callback)
{
    var pr = resolvePrinterID(printerID);

    if (pr !== null)
    {
        sendGetCommandToRoot(pr + '/remoteControl' + statusName,
                function (data)
                {
                    callback(data);
                },
                goToPrinterStatusPage,
                null);
    }
}

function getPrinterStatus(printerID, callback)
{
    var pr = resolvePrinterID(printerID);
    
    if (pr !== null)
    {
        sendGetCommandToRoot(pr + '/remoteControl',
                function (data)
                {
                    callback(data);
                },
                goToPrinterStatusPage,
                null);
    }
}

function updateHomeServerStatus(data)
{
    $('#machine-ip').text(data.serverIP)
}

function getHomeServerStatus(successCallback, failCallback)
{
    sendGetCommandToRoot('discovery/whoareyou',
            successCallback,
            failCallback,
            null);
}

function getHomeData()
{
	var selectedPrinter = localStorage.getItem(selectedPrinterVar);
	if (selectedPrinter !== null)
	{
		getHomeServerStatus(updateHomeServerStatus, updateHomeServerStatus);
		
        // Either get all the data in one lump
        getPrinterStatus(selectedPrinter, updateHomeData);
		// Or get the data in smaller segments.
		//getStatusData(selectedPrinter, '/nameStatus', updateNameStatus)
		//getStatusData(selectedPrinter, '/materialStatus', updateMaterialStatus)
		//getStatusData(selectedPrinter, '/headStatus', updateHeadStatus)
		//getStatusData(selectedPrinter, '/printJobStatus', updatePrintJobStatus)
		//getStatusData(selectedPrinter, '/controlStatus', updateControlStatus)
	}
	else
		goToPrinterStatusPage();
}

function startHomeUpdates()
{
	var selectedPrinter = localStorage.getItem(selectedPrinterVar);
	if (selectedPrinter !== null)
	{
	    // Either get all the data in one lump
		setInterval(function() { getPrinterStatus(null, updateHomeData); }, 2000);
		// Or get the data in smaller segments.
		//setInterval(function() { getStatusData(null, '/nameStatus', updateNameStatus); }, 2000);
		//setInterval(function() { getStatusData(null, '/materialStatus', updateMaterialStatus); }, 1000);
		//setInterval(function() { getStatusData(null, '/headStatus', updateHeadStatus); }, 1000);
		//setInterval(function() { getStatusData(null, '/printJobStatus', updatePrintJobStatus); }, 500);
		//setInterval(function() { getStatusData(null, '/controlStatus', updateControlStatus); }, 500);

        // Set off the error notifier.
		setInterval(function() { getStatusData(null, '/activeErrorStatus', handleActiveErrors); }, 500);
    }
}

function homeInit()
{
    localStorage.setItem(printerTypeVar, "RBX01");
    getHomeData();
    startHomeUpdates();
}
