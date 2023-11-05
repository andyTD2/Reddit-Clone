
function findSubredditId()
{
    return document.getElementsByClassName("subName")[0].getAttribute("data-subId");
}

function attachSubscribeListener(subredditId)
{
    $("#saveSubreddit").on("click", function(e) {
        e.preventDefault();
        $.post(`/changeSubscription`, {subredditId: subredditId}).done(function(msg) {
            if(msg == "SUBSCRIBED") $("#saveSubreddit").text("Unsubscribe");		
            else $("#saveSubreddit").text("Subscribe");
        })
    });
}