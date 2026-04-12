document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });
  }

  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = document.getElementById("name")?.value.trim() || "";
      const email = document.getElementById("email")?.value.trim() || "";
      const company = document.getElementById("company")?.value.trim() || "";
      const subject = document.getElementById("subject")?.value.trim() || "";
      const message = document.getElementById("message")?.value.trim() || "";
      const formStatus = document.getElementById("formStatus");

      if (!name || !email || !subject || !message) {
        if (formStatus) {
          formStatus.textContent = "Complete the required fields before sending";
        }
        return;
      }

      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "-"}`,
        "",
        message
      ];

      const mailtoUrl =
        `mailto:rfq@wmaseng.co.uk?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(bodyLines.join("\n"))}`;

      window.location.href = mailtoUrl;

      if (formStatus) {
        formStatus.textContent = "Your email client should open with the enquiry prepared";
      }

      contactForm.reset();
    });
  }
});
