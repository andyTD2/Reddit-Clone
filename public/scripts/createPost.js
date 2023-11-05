function attachCreatePostSubmitListener(subName)
{
    $("#createPostForm").on("submit", function(e) {
        e.preventDefault();
        $("#createPostError").text("");
        $.ajax({
            url: `/r/${subName}/post/newPost`,
            type: "post",
            data: $("#createPostForm").serialize(),
            success: function(data) {
                location.href = `/r/${subName}/post/${data}`;
            },
            error: function(xhr) {
                console.log(xhr.error);
                $("#createPostError").text(xhr.responseText);
            }
        });
    })
};