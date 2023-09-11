
function sendPostVote(thisObj, voteDirection)
{
    let postId = thisObj.parent().parent().attr("data-postId");
    $.post(`/vote/${postId}`, {direction: voteDirection})
        .done(function(data) {
            let parentOfThisDiv = thisObj.parent();
            let voteCount = parentOfThisDiv.find(".voteCount");

            if(voteDirection === 1)
            {
                parentOfThisDiv.find(".downvote").attr("src", "/images/down-arrow.png");
                if(thisObj.attr("src") == "/images/up-arrow-green.png")
                {
                    thisObj.attr("src", "/images/up-arrow.png");
                }
                else
                {
                    thisObj.attr("src", "/images/up-arrow-green.png");
                }
            }
            else
            {
                parentOfThisDiv.find(".upvote").attr("src", "/images/up-arrow.png");
                if(thisObj.attr("src") == "/images/down-arrow-magenta.png")
                {
                    thisObj.attr("src", "/images/down-arrow.png");
                }
                else
                thisObj.attr("src", "/images/down-arrow-magenta.png");
            }
            voteCount.text(parseInt(voteCount.text()) + parseInt(data));
        });
}

$(".posts").on("click", ".upvote", function() {
    sendPostVote($(this), 1)			
})
$(".posts").on("click", ".downvote", function() {
    sendPostVote($(this), -1)			
})