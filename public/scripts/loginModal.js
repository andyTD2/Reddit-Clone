function displayLoginModal() {
    $(".loginModal").addClass("loginModalOpened");
};
$(".openLoginModal").on("click", function(e) {
    e.preventDefault();
    displayLoginModal();
    });

function closeLoginModal() {
    $("#loginErrorAuthentication").css("display", "none");
    $("#loginErrorGeneric").css("display", "none");
    $(".loginModal").removeClass("loginModalOpened");
};
$(".closeLoginModal").on("click", closeLoginModal);

$(".loginForm").on("submit", function(e) {
    e.preventDefault();
    $.ajax({
        url: "/userLogin",
        type: "post",
        data: $(".loginForm").serialize(),
        success: function(data) {location.reload();},
        error: function(xhr, error) {
            if(xhr.status == 401)
            {
                $("#loginErrorAuthentication").css("display", "block");
            }
            else
            {
                $("#loginErrorGeneric").css("display", "block");
            }
        }
    });
})