function createReplyBox(btn) {
    let box = btn.parent().find(".commentForm")[0];
    if(box.style.display == "none")
        box.style.display = "flex";
    else
        box.style.display = "none";

}

function postReply(btn, href)
{
    $.post(
        href,
        {
            parentId: btn.parent().attr("data-parentId"),
            comment: btn.parent().find(".replyComment")[0].value
        },
        function(data, status)
        {
            location.reload();
        }
    );
}

function attachReplyListeners()
{
    $(".replyButton").on("click", function() {
        createReplyBox($(this));
    })

    $(".submitReply").on("click", function() {
        postReply($(this), $(this).attr("data-ref"));
    })
}

function removeReplyListeners()
{
    $(".replyButton").off("click");
    $(".submitReply").off("click");
}

function refreshReplyListeners(subreddit, post)
{
    removeReplyListeners();
    attachReplyListeners();
}