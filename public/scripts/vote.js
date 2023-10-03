function sendVote(thisObj, voteDirection)
{
    let voteUrl;
    let commentId = thisObj.parent().attr("data-commentId");
    if(commentId) voteUrl = `/voteComment/${commentId}`;
    else
    {
        let postId = thisObj.parent().attr("data-postId");
        voteUrl = `/vote/${postId}`;
    }


    $.post( voteUrl, {direction: voteDirection})
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



$(".contentFeed").on("click", ".upvote", function() {
    sendVote($(this), 1);
})

$(".contentFeed").on("click", ".downvote", function() {
    sendVote($(this), -1);
})