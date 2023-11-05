function attachCreateSubredditFormListeners()
{
    $("#createSubredditSubmit").on("click", function(e) {
        e.preventDefault();
    
        $.ajax({
            url: "/createSubreddit",
            type: "post",
            data: {
                "subredditName": $("#subredditName").val(),
                "description": $("#description").val(),
                "sidebar": quill.root.innerHTML
            },
            success: function(data) {
                location.href = data;
            },
            error: function(xhr) {
                $("#createSubredditError").text(xhr.responseText);
            }
        });
    })

    $(".ql-editor").on("input", function() {
        $("#subredditSidebar").html(quill.root.innerHTML.replaceAll(" ", "&nbsp;").replaceAll("\t", "&emsp;"));
    })
     
    $("#subredditName").on("input", function() {
        $(".subredditNamePreview").text($("#subredditName").val());
    })
    
    $("#description").on("input", function() {
        $("#subredditDescription").text($("#description").val());
    })
}