function replacePageNum(data, optionalElementToInsertPageNum)
{
    $(".pageNum").remove();
    const insert = optionalElementToInsertPageNum || document.getElementsByClassName("contentFeed")[0];
    insert.insertAdjacentHTML('beforeend', data);
    return;
}

function removeNextPageListener()
{
    $(".pageNum").off("click");
}

//callBacks is a list of objects where each object is of the format
//{callBack: fn, fnParams: {object}}
function loadContent(data, callBacks, params)
{
    //Refresh the listener since the next page element is replaced
    //once new content is loaded in
    replacePageNum(data, params.optionalElementToInsertPageNum);
    removeNextPageListener();
    attachNextPageListener(callBacks, params);

    for (let callBack of callBacks)
    {
        if(typeof callBack.fn === "function")
            callBack.fn(callBack.fnParams);
    }
}



function attachNextPageListener(callBacks, params)
{
    if(!params) params = {};
    if(!callBacks) callBacks = {};
    
    $(".pageNum").on("click", function(e) {
        e.preventDefault();

        if(params.isPostRequest)
        {
            $.post($(this).attr("href"),
            params.postParams,
            function(data)
            {
                loadContent(data, callBacks, params);
            });
        }
        else
        {
            $.get($(this).attr("href"),
            function(data)
            {
                loadContent(data, callBacks, params);
            });
        }
    });
}