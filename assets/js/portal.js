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

      window.location.href = "portal.html";
    });
  }

  function badgeHtml(label, border, bg, color) {
    return `
      <span style="
        display:inline-flex;
        align-items:center;
        min-height:30px;
        padding:0 10px;
        border-radius:999px;
        border:1px solid ${border};
        background:${bg};
        color:${color};
        font-size:.88rem;
        font-weight:700;
      ">${label}</span>
    `;
  }

  function getQuoteStatusMeta(status) {
    switch (status) {
      case "draft":
        return { label: "Draft", bg: "rgba(170,170,170,.10)", border: "rgba(170,170,170,.24)", color: "#d7dee5" };
      case "issued":
        return { label: "Quoted", bg: "rgba(214,135,52,.14)", border: "rgba(214,135,52,.34)", color: "#f0a85a" };
      case "accepted":
        return { label: "Accepted", bg: "rgba(108,186,92,.14)", border: "rgba(108,186,92,.34)", color: "#8fda7d" };
      case "expired":
        return { label: "Expired", bg: "rgba(124,136,155,.14)", border: "rgba(124,136,155,.34)", color: "#c8d0db" };
      case "withdrawn":
        return { label: "Withdrawn", bg: "rgba(124,136,155,.14)", border: "rgba(124,136,155,.34)", color: "#c8d0db" };
      default:
        return { label: status || "Unknown", bg: "rgba(170,170,170,.10)", border: "rgba(170,170,170,.24)", color: "#d7dee5" };
    }
  }

  function getJobStatusMeta(status) {
    switch (status) {
      case "estimating":
        return { label: "Estimating", bg: "rgba(208,165,47,.14)", border: "rgba(208,165,47,.34)", color: "#f0c75a" };
      case "quoted":
        return { label: "Quoted", bg: "rgba(214,135,52,.14)", border: "rgba(214,135,52,.34)", color: "#f0a85a" };
      case "awaiting_po":
        return { label: "Awaiting PO", bg: "rgba(214,135,52,.14)", border: "rgba(214,135,52,.34)", color: "#f0a85a" };
      case "designing":
        return { label: "Designing", bg: "rgba(65,145,255,.14)", border: "rgba(65,145,255,.34)", color: "#79b2ff" };
      case "awaiting_approval":
        return { label: "Awaiting approval", bg: "rgba(160,110,255,.14)", border: "rgba(160,110,255,.34)", color: "#b798ff" };
      case "drafting_pack":
        return { label: "Drafting pack", bg: "rgba(65,145,255,.14)", border: "rgba(65,145,255,.34)", color: "#79b2ff" };
      case "complete":
        return { label: "Completed", bg: "rgba(108,186,92,.14)", border: "rgba(108,186,92,.34)", color: "#8fda7d" };
      case "issued":
        return { label: "Issued", bg: "rgba(124,136,155,.14)", border: "rgba(124,136,155,.34)", color: "#c8d0db" };
      case "in_progress":
        return { label: "In progress", bg: "rgba(65,145,255,.14)", border: "rgba(65,145,255,.34)", color: "#79b2ff" };
      default:
        return { label: status || "Unknown", bg: "rgba(170,170,170,.10)", border: "rgba(170,170,170,.24)", color: "#d7dee5" };
    }
  }

  function getFileTypeLabel(file) {
    const name = (file.file_name || "").toLowerCase();
    if (name.endsWith(".pdf")) return "PDF";
    if (name.endsWith(".zip")) return "ZIP";
    if (name.endsWith(".dwg")) return "DWG";
    if (name.endsWith(".dxf")) return "DXF";
    return "File";
  }

  function renderJobs(jobs) {
    const el = document.getElementById("jobsCardContent");
    if (!el) {
      return;
    }

    if (!jobs || jobs.length === 0) {
      el.innerHTML = "<p>No live jobs available yet</p>";
      return;
    }

    el.innerHTML = jobs.map(function (job) {
      const status = getJobStatusMeta(job.status);
      return `
        <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
          <div style="font-weight:700;color:#edf1f4">${job.job_ref}</div>
          <div style="margin-top:4px;color:#edf1f4">${job.title}</div>
          <div style="margin-top:10px">
            ${badgeHtml(status.label, status.border, status.bg, status.color)}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderFiles(files, showAll) {
    const el = document.getElementById("filesCardContent");
    if (!el) {
      return;
    }

    if (!files || files.length === 0) {
      el.innerHTML = "<p>No files available yet</p>";
      return;
    }

    const visibleFiles = showAll ? files : files.slice(0, 6);

    el.innerHTML = visibleFiles.map(function (file) {
      const typeLabel = getFileTypeLabel(file);
      const revisionLabel = file.revision ? `Rev ${file.revision}` : "Rev -";

      return `
        <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
          <div style="font-weight:700;color:#edf1f4">${file.title}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            ${badgeHtml(typeLabel, "rgba(124,136,155,.28)", "rgba(124,136,155,.12)", "#d7dee5")}
            ${badgeHtml(revisionLabel, "rgba(208,165,47,.28)", "rgba(208,165,47,.12)", "#f0c75a")}
          </div>
          <div style="margin-top:8px;font-size:.92rem;color:#a8b2bc">${file.file_name}</div>
          <div style="margin-top:10px">
            <a class="btn" href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer">Download</a>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCommercial(files) {
    const el = document.getElementById("commercialCardContent");
    if (!el) {
      return;
    }

    if (!files || files.length === 0) {
      el.innerHTML = "<p>No commercial documents available yet</p>";
      return;
    }

    el.innerHTML = files.map(function (file) {
      const kindLabel = (file.document_kind || "document").toUpperCase();
      const revisionLabel = file.revision ? `Rev ${file.revision}` : "Rev -";

      return `
        <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
          <div style="font-weight:700;color:#edf1f4">${file.title}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            ${badgeHtml(kindLabel, "rgba(214,135,52,.28)", "rgba(214,135,52,.12)", "#f0a85a")}
            ${badgeHtml(revisionLabel, "rgba(124,136,155,.28)", "rgba(124,136,155,.12)", "#d7dee5")}
          </div>
          <div style="margin-top:8px;font-size:.92rem;color:#a8b2bc">${file.file_name}</div>
          <div style="margin-top:10px">
            <a class="btn" href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer">Download</a>
          </div>
        </div>
      `;
    }).join("");
  }

function renderMessages(messages) {
  const el = document.getElementById("messagesCardContent");
  if (!el) {
    return;
  }

  if (!messages || messages.length === 0) {
    el.innerHTML = "<p>No messages yet</p>";
    return;
  }

  el.innerHTML = messages.map(function (message) {
    const senderLabel = message.is_system
      ? "System"
      : (message.sender_role === "admin" ? "WMAS" : "Client");

    const formattedBody = (message.message_body || "").replace(/\n/g, "<br>");

    return `
      <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="font-weight:700;color:#edf1f4">${message.subject || "Message"}</div>
          <div style="font-size:.84rem;color:#a8b2bc">${senderLabel}</div>
        </div>
        <div style="margin-top:8px;color:#d7dee5;line-height:1.7">${formattedBody}</div>
        <div style="margin-top:8px;font-size:.82rem;color:#a8b2bc">${new Date(message.created_at).toLocaleString()}</div>
      </div>
    `;
  }).join("");
}

  async function loadJobs(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_jobs")
      .select("id, company_id, quote_id, job_ref, title, status, started_at, quote_accepted_at, quote_accepted_by, po_received_at")
      .eq("company_id", companyId)
      .order("started_at", { ascending: false });

    if (error) {
      const el = document.getElementById("jobsCardContent");
      if (el) {
        el.textContent = "Unable to load jobs";
      }
      return [];
    }

    renderJobs(data || []);
    return data || [];
  }

  async function loadFiles(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_job_files")
      .select("title, file_name, storage_path, file_type, revision, created_at")
      .eq("company_id", companyId)
      .eq("visible_to_client", true)
      .order("created_at", { ascending: false });

    if (error) {
      const el = document.getElementById("filesCardContent");
      if (el) {
        el.textContent = "Unable to load files";
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

    let showAll = false;
    renderFiles(filesWithUrls, showAll);

    const expandBtn = document.getElementById("filesExpandBtn");
    if (expandBtn) {
      expandBtn.onclick = function () {
        showAll = !showAll;
        expandBtn.textContent = showAll ? "Show less" : "View all";
        renderFiles(filesWithUrls, showAll);
      };
    }
  }

  async function loadCommercial(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_commercial_files")
      .select("id, company_id, job_id, quote_id, title, document_kind, file_name, storage_path, file_type, revision, created_at")
      .eq("company_id", companyId)
      .eq("visible_to_client", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      const el = document.getElementById("commercialCardContent");
      if (el) {
        el.textContent = "Unable to load commercial documents";
      }
      return [];
    }

    const docsWithUrls = await Promise.all(
      (data || []).map(async function (file) {
        const { data: signedData } = await supabaseClient.storage
          .from("wmas-commercial-files")
          .createSignedUrl(file.storage_path, 3600);

        return {
          ...file,
          downloadUrl: signedData?.signedUrl || "#"
        };
      })
    );

    renderCommercial(docsWithUrls);
    return docsWithUrls;
  }

  async function loadMessages(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_messages")
      .select("id, subject, message_body, sender_role, is_system, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      const el = document.getElementById("messagesCardContent");
      if (el) {
        el.textContent = "Unable to load messages";
      }
      return;
    }

    renderMessages(data || []);
  }

  async function sendMessage(profile) {
    const subjectEl = document.getElementById("portalMessageSubject");
    const bodyEl = document.getElementById("portalMessageBody");
    const statusEl = document.getElementById("portalMessageStatus");

    if (!subjectEl || !bodyEl || !statusEl) {
      return;
    }

    const subject = subjectEl.value.trim();
    const messageBody = bodyEl.value.trim();

    if (!messageBody) {
      statusEl.textContent = "Write a message before sending";
      return;
    }

    statusEl.textContent = "Sending message";

    const { error } = await supabaseClient
      .from("wmas_messages")
      .insert({
        company_id: profile.company_id,
        sender_profile_id: profile.id,
        sender_role: profile.role,
        subject: subject || "Portal message",
        message_body: messageBody,
        is_system: false
      });

    if (error) {
      statusEl.textContent = error.message || "Unable to send message";
      return;
    }

    subjectEl.value = "";
    bodyEl.value = "";
    statusEl.textContent = "Message sent";
    await loadMessages(profile.company_id);
  }

  async function insertJobEvent(job, eventType, eventLabel, eventNotes, userId) {
    await supabaseClient.from("wmas_job_events").insert({
      job_id: job.id,
      company_id: job.company_id,
      event_type: eventType,
      event_label: eventLabel,
      event_notes: eventNotes,
      acted_by: userId
    });
  }

  async function handleAcceptQuote(job, userId) {
    const statusEl = document.getElementById("commercialActionStatus");
    if (statusEl) {
      statusEl.textContent = "Accepting quote";
    }

    const { error } = await supabaseClient
      .from("wmas_jobs")
      .update({
        status: "awaiting_po",
        quote_accepted_at: new Date().toISOString(),
        quote_accepted_by: userId
      })
      .eq("id", job.id);

    if (error) {
      if (statusEl) {
        statusEl.textContent = error.message || "Unable to accept quote";
      }
      return false;
    }

    await insertJobEvent(
      job,
      "quote_accepted",
      "Quote accepted",
      "Client accepted the quote and is ready to upload a purchase order",
      userId
    );

    if (statusEl) {
      statusEl.textContent = "Thank you for ordering with WMAS. Next step, upload your purchase order now to secure capacity";
    }

    return true;
  }

  async function handlePoUpload(job, profile, file) {
    const statusEl = document.getElementById("commercialActionStatus");

    if (!file) {
      if (statusEl) {
        statusEl.textContent = "Choose a PO file before uploading";
      }
      return false;
    }

    const safeFileName = file.name.replace(/\s+/g, "_");
    const objectPath = `${profile.company_id}/${job.job_ref}_${safeFileName}`;

    if (statusEl) {
      statusEl.textContent = "Uploading purchase order";
    }

    const uploadResult = await supabaseClient.storage
      .from("wmas-commercial-files")
      .upload(objectPath, file, {
        upsert: true
      });

    if (uploadResult.error) {
      if (statusEl) {
        statusEl.textContent = uploadResult.error.message || "Unable to upload purchase order";
      }
      return false;
    }

    const insertResult = await supabaseClient
      .from("wmas_commercial_files")
      .insert({
        company_id: job.company_id,
        job_id: job.id,
        quote_id: job.quote_id || null,
        title: `${job.job_ref} Purchase Order`,
        document_kind: "po",
        file_name: file.name,
        storage_path: objectPath,
        file_type: file.type || "application/pdf",
        revision: "A",
        visible_to_client: true,
        uploaded_by: profile.id,
        status: "received",
        sort_order: 20
      });

    if (insertResult.error) {
      if (statusEl) {
        statusEl.textContent = insertResult.error.message || "Unable to register purchase order";
      }
      return false;
    }

    const updateResult = await supabaseClient
      .from("wmas_jobs")
      .update({
        status: "designing",
        po_received_at: new Date().toISOString(),
        po_uploaded_by: profile.id
      })
      .eq("id", job.id);

    if (updateResult.error) {
      if (statusEl) {
        statusEl.textContent = updateResult.error.message || "Unable to update job after PO upload";
      }
      return false;
    }

    await insertJobEvent(
      job,
      "po_uploaded",
      "Purchase order uploaded",
      "Client uploaded a purchase order and the job moved into designing",
      profile.id
    );

    if (statusEl) {
      statusEl.textContent = "Congratulations, your order is in progress";
    }

    return true;
  }

  function renderCommercialActions(job, profile, reloadFn) {
    const actionArea = document.getElementById("commercialActionArea");
    const statusEl = document.getElementById("commercialActionStatus");

    if (!actionArea || !statusEl) {
      return;
    }

    if (!job) {
      actionArea.innerHTML = "";
      statusEl.textContent = "No current action";
      return;
    }

    if (job.status === "quoted") {
      actionArea.innerHTML = `
        <button id="acceptQuoteBtn" class="btn btn-primary" type="button">Accept Quote</button>
      `;
      statusEl.textContent = "This quote is ready for acceptance";

      const btn = document.getElementById("acceptQuoteBtn");
      if (btn) {
        btn.onclick = async function () {
          const ok = await handleAcceptQuote(job, profile.id);
          if (ok) {
            await reloadFn();
          }
        };
      }
      return;
    }

    if (job.status === "awaiting_po") {
      actionArea.innerHTML = `
        <div class="form-group">
          <label for="poUploadInput">Upload Purchase Order</label>
          <input id="poUploadInput" type="file" accept=".pdf,.zip,.dwg,.dxf">
        </div>
        <div class="cta-row" style="margin-top:12px">
          <button id="uploadPoBtn" class="btn btn-primary" type="button">Upload PO</button>
        </div>
      `;
      statusEl.textContent = "Upload your purchase order now to secure capacity";

      const btn = document.getElementById("uploadPoBtn");
      const input = document.getElementById("poUploadInput");

      if (btn && input) {
        btn.onclick = async function () {
          const file = input.files && input.files[0] ? input.files[0] : null;
          const ok = await handlePoUpload(job, profile, file);
          if (ok) {
            await reloadFn();
          }
        };
      }
      return;
    }

    actionArea.innerHTML = "";
    statusEl.textContent = "No current action for this job";
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
      .select("id, full_name, email, role, company_id, is_active")
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

    async function reloadPortalData() {
      const jobs = await loadJobs(profile.company_id);
      await loadFiles(profile.company_id);
      await loadCommercial(profile.company_id);
      await loadMessages(profile.company_id);

      const activeCommercialJob =
        jobs.find(function (job) {
          return job.status === "quoted" || job.status === "awaiting_po";
        }) || null;

      renderCommercialActions(activeCommercialJob, profile, reloadPortalData);
    }

    await reloadPortalData();

    const sendPortalMessageBtn = document.getElementById("sendPortalMessageBtn");
    if (sendPortalMessageBtn) {
      sendPortalMessageBtn.onclick = async function () {
        await sendMessage(profile);
      };
    }

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
