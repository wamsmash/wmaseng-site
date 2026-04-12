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

    function getQuoteStatusMeta(status) {
      switch (status) {
        case "draft":
          return {
            label: "Draft",
            bg: "rgba(170,170,170,.10)",
            border: "rgba(170,170,170,.24)",
            color: "#d7dee5"
          };
        case "issued":
          return {
            label: "Quoted",
            bg: "rgba(214,135,52,.14)",
            border: "rgba(214,135,52,.34)",
            color: "#f0a85a"
          };
        case "accepted":
          return {
            label: "Accepted",
            bg: "rgba(108,186,92,.14)",
            border: "rgba(108,186,92,.34)",
            color: "#8fda7d"
          };
        case "expired":
          return {
            label: "Expired",
            bg: "rgba(124,136,155,.14)",
            border: "rgba(124,136,155,.34)",
            color: "#c8d0db"
          };
        case "withdrawn":
          return {
            label: "Withdrawn",
            bg: "rgba(124,136,155,.14)",
            border: "rgba(124,136,155,.34)",
            color: "#c8d0db"
          };
        default:
          return {
            label: status || "Unknown",
            bg: "rgba(170,170,170,.10)",
            border: "rgba(170,170,170,.24)",
            color: "#d7dee5"
          };
      }
    }

    const html = quotes
      .map(function (quote) {
        const status = getQuoteStatusMeta(quote.status);

        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${quote.quote_ref}</div>
            <div style="margin-top:4px;color:#edf1f4">${quote.title}</div>
            <div style="margin-top:10px">
              <span style="
                display:inline-flex;
                align-items:center;
                min-height:30px;
                padding:0 10px;
                border-radius:999px;
                border:1px solid ${status.border};
                background:${status.bg};
                color:${status.color};
                font-size:.88rem;
                font-weight:700;
              ">${status.label}</span>
            </div>
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

    function getStatusMeta(status) {
      switch (status) {
        case "estimating":
          return {
            label: "Estimating",
            bg: "rgba(208,165,47,.14)",
            border: "rgba(208,165,47,.34)",
            color: "#f0c75a"
          };
        case "quoted":
          return {
            label: "Quoted",
            bg: "rgba(214,135,52,.14)",
            border: "rgba(214,135,52,.34)",
            color: "#f0a85a"
          };
        case "in_progress":
          return {
            label: "In progress",
            bg: "rgba(65,145,255,.14)",
            border: "rgba(65,145,255,.34)",
            color: "#79b2ff"
          };
        case "complete":
          return {
            label: "Completed",
            bg: "rgba(108,186,92,.14)",
            border: "rgba(108,186,92,.34)",
            color: "#8fda7d"
          };
        case "issued":
          return {
            label: "Issued",
            bg: "rgba(124,136,155,.14)",
            border: "rgba(124,136,155,.34)",
            color: "#c8d0db"
          };
        case "pending_po":
          return {
            label: "Pending PO",
            bg: "rgba(170,170,170,.10)",
            border: "rgba(170,170,170,.24)",
            color: "#d7dee5"
          };
        default:
          return {
            label: status || "Unknown",
            bg: "rgba(170,170,170,.10)",
            border: "rgba(170,170,170,.24)",
            color: "#d7dee5"
          };
      }
    }

    const html = jobs
      .map(function (job) {
        const status = getStatusMeta(job.status);

        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${job.job_ref}</div>
            <div style="margin-top:4px;color:#edf1f4">${job.title}</div>
            <div style="margin-top:10px">
              <span style="
                display:inline-flex;
                align-items:center;
                min-height:30px;
                padding:0 10px;
                border-radius:999px;
                border:1px solid ${status.border};
                background:${status.bg};
                color:${status.color};
                font-size:.88rem;
                font-weight:700;
              ">${status.label}</span>
            </div>
          </div>
        `;
      })
      .join("");

    jobsCardContent.innerHTML = html;
  }

  function getFileTypeLabel(file) {
    const name = (file.file_name || "").toLowerCase();

    if (name.endsWith(".pdf")) {
      return "PDF";
    }

    if (name.endsWith(".zip")) {
      return "ZIP";
    }

    if (name.endsWith(".dwg")) {
      return "DWG";
    }

    if (name.endsWith(".dxf")) {
      return "DXF";
    }

    return "File";
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
        const typeLabel = getFileTypeLabel(file);
        const revisionLabel = file.revision ? `Rev ${file.revision}` : "Rev -";

        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${file.title}</div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              <span style="
                display:inline-flex;
                align-items:center;
                min-height:28px;
                padding:0 10px;
                border-radius:999px;
                border:1px solid rgba(124,136,155,.28);
                background:rgba(124,136,155,.12);
                color:#d7dee5;
                font-size:.84rem;
                font-weight:700;
              ">${typeLabel}</span>
              <span style="
                display:inline-flex;
                align-items:center;
                min-height:28px;
                padding:0 10px;
                border-radius:999px;
                border:1px solid rgba(208,165,47,.28);
                background:rgba(208,165,47,.12);
                color:#f0c75a;
                font-size:.84rem;
                font-weight:700;
              ">${revisionLabel}</span>
            </div>
            <div style="margin-top:8px;font-size:.92rem;color:#a8b2bc">${file.file_name}</div>
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
      .select("title, file_name, storage_path, file_type, revision, created_at")
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
