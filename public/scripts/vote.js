function updateVoteImg(upvoteElement, downvoteElement, voteDirection)
{
    if(voteDirection === 1)
    {
        downvoteElement.attr("src", "/images/down-arrow.png");

        if(upvoteElement.attr("src") == "/images/up-arrow-green.png")
            upvoteElement.attr("src", "/images/up-arrow.png");
        else
            upvoteElement.attr("src", "/images/up-arrow-green.png");
    }
    else
    {
        upvoteElement.attr("src", "/images/up-arrow.png");

        if(downvoteElement.attr("src") == "/images/down-arrow-magenta.png")
            downvoteElement.attr("src", "/images/down-arrow.png");
        else
            downvoteElement.attr("src", "/images/down-arrow-magenta.png");
    }
}

function updateVoteCount(voteCountElement, voteDirection)
{
    voteCountElement.text(parseInt(voteCountElement.text()) + parseInt(voteDirection));
}

function sendVote(voteContainer, voteDirection, voteUrl)
{
    $.post( voteUrl, {direction: voteDirection})
        .done(function(data) {
            let voteCountElement = voteContainer.find(".voteCount");
            let upvote = voteContainer.find(".upvote");
            let downvote = voteContainer.find(".downvote");

            updateVoteImg(upvote, downvote, voteDirection);
            updateVoteCount(voteCountElement, data);
        });
}

function getVoteUrl(voteContainer)
{
    let voteUrl;
    let commentId = voteContainer.attr("data-commentId");
    if(commentId) voteUrl = `/voteComment/${commentId}`;
    else
    {
        let postId = voteContainer.attr("data-postId");
        voteUrl = `/vote/${postId}`;
    }

    return voteUrl;
}

function attachVoteListener()
{
    $(".upvote").on("click", function() {
        sendVote($(this).parent(), 1, getVoteUrl($(this).parent()));
    });

    $(".downvote").on("click", function() {
        sendVote($(this).parent(), -1, getVoteUrl($(this).parent()));
    });
}

function removeVoteListener()
{
    $(".upvote").off("click");

    $(".downvote").off("click");
}

function refreshVoteListeners()
{
    removeVoteListener();
    attachVoteListener();
}