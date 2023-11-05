function displayLoginModal()
{
    $("#loginModal").addClass("modalOpened");
}

function closeLoginModal() 
{
    $("#loginModalError").text("");
    $("#loginModal").removeClass("modalOpened");
}

function attachLoginModalListeners()
{
    $(".openLoginModal").on("click", function(e) {
        e.preventDefault();
        displayLoginModal();
    });

    $("#closeLoginModal").on("click", closeLoginModal);

    $("#loginForm").on("submit", function(e) {
        e.preventDefault();
        $.ajax({
            url: "/userLogin",
            type: "post",
            data: $("#loginForm").serialize(),
            success: function(data) {location.reload();},
            error: function(xhr) {
                $("#loginModalError").text(xhr.responseText);
            }
        });
    })
}

function removeLoginModalListeners()
{
    $(".openLoginModal").off("click");
    $("#closeLoginModal").off("click");
    $("#loginForm").off("submit");
}

function refreshLoginModalListeners()
{
    removeLoginModalListeners();
    attachLoginModalListeners();
}
