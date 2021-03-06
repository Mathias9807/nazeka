// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// we only use a tiny number of settings here

let reader_settings = {
reader_reverse: false,
reader_leeway: 200,
reader_bg: "#111111",
reader_fg: "#CCCCCC",
reader_font_size: "1.4em",
reader_right_padding: "0px",
reader_max_width: "1000px",
reader_margin: "8px",
reader_font: "",
reader_auto: false
};

function update_styles()
{
    let target = document.body.style;
    target.backgroundColor = reader_settings.reader_bg;
    target.color = reader_settings.reader_fg;
    target.fontSize = reader_settings.reader_font_size;
    target.paddingRight = reader_settings.reader_right_padding;
    target.maxWidth = reader_settings.reader_max_width;
    target.marginLeft = reader_settings.reader_margin;
    target.marginRight = reader_settings.reader_margin;
    target.fontFamily = reader_settings.reader_font;
}

async function reader_settings_init()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name];
            if(temp == undefined)
                temp = defval;
            reader_settings[name] = temp;
        }
        getvar("reader_reverse", false);
        getvar("reader_leeway", 200);
        getvar("reader_bg", "#111111");
        getvar("reader_fg", "#CCCCCC");
        getvar("reader_font_size","1.4em");
        getvar("reader_right_padding", "0px");
        getvar("reader_max_width", "1000px");
        getvar("reader_margin", "8px");
        getvar("reader_font", "");
        getvar("reader_auto", false);
    } catch(err) {} // options not stored yet
}

reader_settings_init();

browser.storage.onChanged.addListener((updates, storageArea) =>
{
    if(storageArea != "local") return;
    for(let setting of Object.entries(updates))
    {
        let option = setting[0];
        let value = setting[1];
        if(Object.keys(reader_settings).includes(option))
            reader_settings[option] = value.newValue;
    }
    update_styles();
});

// actual reder code

function reader_might_have_japanese(text)
{
    for(let char of text)
        if(char && char.length > 0 && char.codePointAt(0) >= 0x2E80)
            return true;
    return false;
}

function reader_update(text)
{
    if(!reader_might_have_japanese(text))
        return;
    
    let target = document.body;
    let newnode = document.createElement("p");
    newnode.textContent = text;
    
    if(!reader_settings.reader_reverse)
        target.insertBefore(newnode, document.body.firstChild);
    else
    {
        target.appendChild(newnode);
        
        if(reader_settings.reader_leeway != 0)
        {
            let scroll_end_distance = -document.body.scrollHeight + -document.body.clientHeight + 2*document.body.offsetHeight - document.body.scrollTop;

            if (scroll_end_distance < reader_settings.reader_leeway)
                window.scrollTo(0, document.body.scrollHeight);
        }
    }
    
    document.getElementById("linecount").innerText = parseInt(document.getElementById("linecount").innerText)+1;
    
    let x = newnode.getBoundingClientRect().x - document.documentElement.getBoundingClientRect().x;
    let y = newnode.getBoundingClientRect().y - document.documentElement.getBoundingClientRect().y;
    y += Math.min(5, newnode.getBoundingClientRect().height/2);
    
    if(reader_settings.reader_auto)
        send_lookup_request(x, y, text);
}

async function send_lookup_request(x, y, text)
{
    let id = (await browser.tabs.getCurrent()).id;
    browser.runtime.sendMessage({id:id, type:"reader_lookup", x:x, y:y, text:text});
}

async function send_reader_mode(x, y, text)
{
    let id = (await browser.tabs.getCurrent()).id;
    browser.runtime.sendMessage({id:id, type:"reader_mode"});
}

let reader_text_previous = "";
function reader_cycle_text(text)
{
    if(text != "" && text != reader_text_previous)
    {
        reader_update(text);
        update_styles();
    }
    reader_text_previous = text;
}

function reader_gimmetext()
{
    browser.runtime.sendMessage({type:"gimmetext"});
}

let interval = 250;
async function reader_checkpaste()
{
    try
    {
        let text = await reader_gimmetext();
        reader_cycle_text(text);
    }
    catch(error){}
    
    setTimeout(reader_checkpaste, interval);
}
setTimeout(reader_checkpaste, interval);

browser.runtime.onMessage.addListener((req, sender) =>
{
    if (req.type == "text")
        reader_cycle_text(req.text);
    return Promise.resolve(undefined);
});

window.onload = () =>
{
    send_reader_mode();
    update_styles();
}
