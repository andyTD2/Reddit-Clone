function sendCommentVote(thisObj, voteDirection)
{
    let commentId = thisObj.parent().attr("data-commentId");
    $.post(
        `/voteComment/${commentId}`,
        {
            //1 for upvote -1 for downvote
            direction: voteDirection
        },
        function(data, status){
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
        }
    );
}



$(".comments").on("click", ".upvote", function() {
    sendCommentVote($(this), 1);
})

$(".comments").on("click", ".downvote", function() {
    sendCommentVote($(this), -1);
})