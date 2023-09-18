function displayLoginModal() {
    $("#loginModal").addClass("modalOpened");
};
$(".openLoginModal").on("click", function(e) {
    e.preventDefault();
    displayLoginModal();
    });

function closeLoginModal() {
    $("#loginModalError").text("");
    $("#loginModal").removeClass("modalOpened");
};
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