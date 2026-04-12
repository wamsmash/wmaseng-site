(function () {
  const SUPABASE_URL = "https://fkqachwvdeswollxgobd.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_5N68Cgko4Dbt5QKqwDbIEw_-4tU_kea";

  if (typeof window.supabase === "undefined") {
    return;
  }

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  async function handleLoginPage() {
    const loginForm = document.getElementById("clientLoginForm");
    const loginStatus = document.getElementById("loginStatus");

    if (!loginForm) {
      return;
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {
      window.location.href = "portal.html";
      return;
    }

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const email = document.getElementById("loginEmail")?.value.trim() || "";
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        if (loginStatus) {
          loginStatus.textContent = "Enter your email and password";
        }
        return;
      }

      if (loginStatus) {
        loginStatus.textContent = "Signing in";
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (loginStatus) {
          loginStatus.textContent = error.message || "Unable to sign in";
        }
        return;
      }

      if (loginStatus) {
        loginStatus.textContent = "Sign in successful, redirecting";
      }

      window.location.href = "portal.html";
    });
  }

  async function handlePortalPage() {
    const welcomeEl = document.getElementById("portalWelcome");
    const subtextEl = document.getElementById("portalSubtext");
    const signOutBtn = document.getElementById("portalSignOut");

    if (!welcomeEl || !subtextEl) {
      return;
    }

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "client-login.html";
      return;
    }

    const userId = session.user.id;

    const { data: profile, error } = await supabaseClient
      .from("wmas_profiles")
      .select("full_name, email, role, company_id, is_active")
      .eq("id", userId)
      .single();

    if (error || !profile || profile.is_active !== true) {
      await supabaseClient.auth.signOut();
      window.location.href = "client-login.html";
      return;
    }

    welcomeEl.textContent = `Welcome, ${profile.full_name || "Client"}`;
    subtextEl.textContent =
      profile.role === "admin"
        ? "Admin access is active. Portal modules can now be built onto this shell"
        : "Client access is active. Your quotes, jobs, files and messages will appear here";

    if (signOutBtn) {
      signOutBtn.addEventListener("click", async function () {
        await supabaseClient.auth.signOut();
        window.location.href = "client-login.html";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    handleLoginPage();
    handlePortalPage();
  });
})();
