function displaySignupModal() {
    $("#signupModal").addClass("modalOpened");
};
$(".openSignupModal").on("click", function(e) {
    e.preventDefault();
    displaySignupModal();
    });

function closeSignupModal() {
    $("#signupModalError").text("");
    $("#signupModal").removeClass("modalOpened");
};
$("#closeSignupModal").on("click", closeSignupModal);

$("#signupForm").on("submit", function(e) {
    e.preventDefault();
    if(isUsernameValid && isPasswordValid)
    {
        $.ajax({
            url: "/createUser",
            type: "post",
            data: $("#signupForm").serialize(),
            success: function(msg) {
                $("#signupModalSuccess").text("Account successfully created! Redirecting soon...");
                setTimeout(function() {
                    location.reload();
                }, 5000);},
            error: function(xhr) {
                $("#signupModalError").text(xhr.responseText);
            }
        });
    }
    else
    {
        $("#signupModalError").text("Requirements not met!")
    }
})

let isUsernameValid = false;

const usernameValidation = new RegExp("^[a-zA-Z0-9_-]*$");

$("#usernameSignupInput").on("input", function() {
    const usernameInput = $("#usernameSignupInput").val();

    let charactersValid = usernameValidation.test(usernameInput);
    let lengthValid = usernameInput.length >= 3 && usernameInput.length <= 20;

    isUsernameValid = charactersValid && lengthValid;

    setRequirementsColor(lengthValid, "#usernameLengthRequirement");
    setRequirementsColor(charactersValid, "#usernameCharactersRequirement");
})

const atLeastOneNum = new RegExp(".*[0-9].*");
const atLeastOneAlpha = new RegExp(".*[a-zA-Z].*");
const atLeastOneSpecial = new RegExp(".*[!@._-].*");
const passwordValidation = new RegExp("^[a-zA-Z0-9!@._-]*$")

let isPasswordValid = false;

$("#passwordSignupInput").on("input", function() {
    const passwordInput = $("#passwordSignupInput").val();

    let lengthValid = passwordInput.length >= 8 && passwordInput.length <= 30;
    let hasOneNum = atLeastOneNum.test(passwordInput);
    let hasOneAlpha = atLeastOneAlpha.test(passwordInput);
    let hasOneSpecial = atLeastOneSpecial.test(passwordInput) && passwordValidation.test(passwordInput);

    isPasswordValid = (lengthValid && hasOneNum && hasOneAlpha && hasOneSpecial)

    setRequirementsColor(lengthValid, "#passwordLengthRequirement");
    setRequirementsColor(hasOneNum, "#passwordNumRequirement");
    setRequirementsColor(hasOneAlpha, "#passwordAlphaRequirement");
    setRequirementsColor(hasOneSpecial, "#passwordSpecialRequirement");
});


//Sets the color of the requirements text to let the user know if they have met the password or username requirements.
//the html class "incorrectFormat" has css styling which turns the text red
//the html class "correctFormat" has css styling which turns the text green
function setRequirementsColor(requirementFilled, requirementSelector) {
    if(requirementFilled)
    {
        $(requirementSelector).removeClass("incorrectFormat");
        $(requirementSelector).addClass("correctFormat");
    }
    else
    {
        $(requirementSelector).removeClass("correctFormat");
        $(requirementSelector).addClass("incorrectFormat");
    }
    return;
}