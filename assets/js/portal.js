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

  function renderQuotes(quotes) {
    const quotesCardContent = document.getElementById("quotesCardContent");

    if (!quotesCardContent) {
      return;
    }

    if (!quotes || quotes.length === 0) {
      quotesCardContent.innerHTML = "<p>No quotes available yet</p>";
      return;
    }

    const html = quotes
      .map(function (quote) {
        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${quote.quote_ref}</div>
            <div style="margin-top:4px;color:#edf1f4">${quote.title}</div>
            <div style="margin-top:6px;font-size:.92rem;color:#a8b2bc">Status: ${quote.status}</div>
          </div>
        `;
      })
      .join("");

    quotesCardContent.innerHTML = html;
  }

  function renderJobs(jobs) {
    const jobsCardContent = document.getElementById("jobsCardContent");

    if (!jobsCardContent) {
      return;
    }

    if (!jobs || jobs.length === 0) {
      jobsCardContent.innerHTML = "<p>No live jobs available yet</p>";
      return;
    }

    const html = jobs
      .map(function (job) {
        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${job.job_ref}</div>
            <div style="margin-top:4px;color:#edf1f4">${job.title}</div>
            <div style="margin-top:6px;font-size:.92rem;color:#a8b2bc">Status: ${job.status}</div>
          </div>
        `;
      })
      .join("");

    jobsCardContent.innerHTML = html;
  }

  function renderFiles(files) {
    const filesCardContent = document.getElementById("filesCardContent");

    if (!filesCardContent) {
      return;
    }

    if (!files || files.length === 0) {
      filesCardContent.innerHTML = "<p>No files available yet</p>";
      return;
    }

    const html = files
      .map(function (file) {
        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${file.title}</div>
            <div style="margin-top:4px;font-size:.92rem;color:#a8b2bc">${file.file_name}</div>
            <div style="margin-top:10px">
              <a class="btn" href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer">Download</a>
            </div>
          </div>
        `;
      })
      .join("");

    filesCardContent.innerHTML = html;
  }

  async function loadQuotes(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_quotes")
      .select("quote_ref, title, status, issued_at")
      .eq("company_id", companyId)
      .order("issued_at", { ascending: false });

    if (error) {
      const quotesCardContent = document.getElementById("quotesCardContent");
      if (quotesCardContent) {
        quotesCardContent.textContent = "Unable to load quotes";
      }
      return;
    }

    renderQuotes(data || []);
  }

  async function loadJobs(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_jobs")
      .select("job_ref, title, status, started_at")
      .eq("company_id", companyId)
      .order("started_at", { ascending: false });

    if (error) {
      const jobsCardContent = document.getElementById("jobsCardContent");
      if (jobsCardContent) {
        jobsCardContent.textContent = "Unable to load jobs";
      }
      return;
    }

    renderJobs(data || []);
  }

  async function loadFiles(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_job_files")
      .select("title, file_name, storage_path, created_at")
      .eq("company_id", companyId)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false });

    if (error) {
      const filesCardContent = document.getElementById("filesCardContent");
      if (filesCardContent) {
        filesCardContent.textContent = "Unable to load files";
      }
      return;
    }

    const filesWithUrls = await Promise.all(
      (data || []).map(async function (file) {
        const { data: signedData } = await supabaseClient.storage
          .from("wmas-job-files")
          .createSignedUrl(file.storage_path, 3600);

        return {
          ...file,
          downloadUrl: signedData?.signedUrl || "#"
        };
      })
    );

    renderFiles(filesWithUrls);
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

    await loadQuotes(profile.company_id);
    await loadJobs(profile.company_id);
    await loadFiles(profile.company_id);

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
