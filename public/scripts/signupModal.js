function displaySignupModal() 
{
    $("#signupModal").addClass("modalOpened");
}

function closeSignupModal() 
{
    $("#signupModalError").text("");
    $("#signupModal").removeClass("modalOpened");
};

function validateUsername(username)
{
    const usernameValidation = new RegExp("^[a-zA-Z0-9_-]*$");

    let validation = {
        charactersValid: usernameValidation.test(username), 
        lengthValid: username.length >= 3 && username.length <= 20
    };
    validation["valid"] = validation.charactersValid && validation.lengthValid;

    return validation;
};

function validatePassword(password)
{
    const atLeastOneNum = new RegExp(".*[0-9].*");
    const atLeastOneAlpha = new RegExp(".*[a-zA-Z].*");
    const atLeastOneSpecial = new RegExp(".*[!@._-].*");
    const passwordValidation = new RegExp("^[a-zA-Z0-9!@._-]*$");


    let validation = {
        lengthValid: password.length >= 8 && password.length <= 30, 
        hasOneNum: atLeastOneNum.test(password), 
        hasOneAlpha: atLeastOneAlpha.test(password), 
        hasOneSpecial: atLeastOneSpecial.test(password) && passwordValidation.test(password),
    };
    validation["valid"] = (validation.lengthValid && validation.hasOneNum && validation.hasOneAlpha && validation.hasOneSpecial);
    
    return validation;
}

function submitSignup(isUsernameValid, isPasswordValid)
{
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
}


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

function attachSignupModalListeners()
{
    $(".openSignupModal").on("click", function(e) {
        e.preventDefault();
        displaySignupModal();
    });

    $("#closeSignupModal").on("click", closeSignupModal);

    let isUsernameValid = false;
    let isPasswordValid = false;

    $("#usernameSignupInput").on("input", function() {
        const usernameInput = $("#usernameSignupInput").val();
        let usernameValidity = validateUsername(usernameInput);
        isUsernameValid = usernameValidity.valid;

        setRequirementsColor(usernameValidity.lengthValid, "#usernameLengthRequirement");
        setRequirementsColor(usernameValidity.charactersValid, "#usernameCharactersRequirement");
    })

    $("#passwordSignupInput").on("input", function() {
        const passwordInput = $("#passwordSignupInput").val();
    
        let passwordValidity = validatePassword(passwordInput);
        isPasswordValid = passwordValidity.valid;
    
        setRequirementsColor(passwordValidity.lengthValid, "#passwordLengthRequirement");
        setRequirementsColor(passwordValidity.hasOneNum, "#passwordNumRequirement");
        setRequirementsColor(passwordValidity.hasOneAlpha, "#passwordAlphaRequirement");
        setRequirementsColor(passwordValidity.hasOneSpecial, "#passwordSpecialRequirement");
    });

    $("#signupForm").on("submit", function(e) {
        e.preventDefault();
        submitSignup(isUsernameValid, isPasswordValid);
    })

}