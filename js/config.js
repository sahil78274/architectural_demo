/* ==========================================================================
   VASTU — site configuration
   Edit this file only. No build step required.
   ========================================================================== */

window.VASTU_CONFIG = {
  brand: "VASTU Architecture Design Studio",
  contactPerson: "Naresh Thakran",

  /* Studio numbers. `whatsapp` values must be in international format,
     digits only, without the leading plus. */
  phones: [
    { display: "9971343494", tel: "+919971343494", whatsapp: "919971343494" },
    { display: "9991009143", tel: "+919991009143", whatsapp: "919991009143" }
  ],

  /* ENQUIRY ENDPOINT
     Leave this empty ("") and the consultation form will hand the enquiry to
     WhatsApp — nothing is stored, and the site says so.
     Set it to a real POST endpoint (for example "/api/enquiry" or a form
     service URL) and the form will submit there instead, showing its success
     message only after the server confirms the request. */
  enquiryEndpoint: "",

  /* Intro line used on generic (no-details) WhatsApp messages. */
  whatsappIntro: "Hello VASTU Architecture Design Studio, I would like to discuss a project."
};
