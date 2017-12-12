function restoreListeners()
{
    document.querySelector("#enabled").addEventListener("change", setOptions);
    document.querySelector("#compact").addEventListener("change", setOptions);
    document.querySelector("#length").addEventListener("change", setOptions);
}
function removeListeners()
{
    document.querySelector("#enabled").removeEventListener("change", setOptions);
    document.querySelector("#compact").removeEventListener("change", setOptions);
    document.querySelector("#length").removeEventListener("change", setOptions);
}

async function restoreOptions()
{
    try
    {
        let enabled = (await browser.storage.local.get("enabled")).enabled;
        if(enabled == undefined)
            enabled = false;
        let compact = (await browser.storage.local.get("compact")).compact;
        if(compact == undefined)
            compact = true;
        let length = (await browser.storage.local.get("length")).length;
        if(length == undefined)
            length = 25;
        removeListeners();
        document.querySelector("#enabled").checked = enabled?true:false;
        document.querySelector("#compact").checked = compact?true:false;
        document.querySelector("#length").value = length?length:25;
    }
    catch (error){}
    removeListeners();
    restoreListeners();
}

function setOptions()
{
    browser.storage.local.set(
    {
        enabled: document.querySelector("#enabled").checked,
        compact: document.querySelector("#compact").checked,
        length: parseInt(document.querySelector("#length").value),
    });
}

if (document.readyState == "complete")
{
    restoreOptions();
    //setOptions();
}
else
{
    document.addEventListener("DOMContentLoaded", restoreOptions);
    //document.addEventListener("DOMContentLoaded", setOptions);
}
