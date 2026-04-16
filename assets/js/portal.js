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

  let portalState = {
    profile: null,
    jobs: [],
    technicalFiles: [],
    commercialFiles: [],
    rfqFiles: [],
    messages: [],
    showAllFiles: false,
    searchTerm: "",
    adminCompanies: [],
    adminTargetCompany: null
  };

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

      loginStatus.textContent = "Signing in";

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        loginStatus.textContent = error.message || "Unable to sign in";
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

  function getJobStatusMeta(status) {
    switch (status) {
      case "rfq_submitted":
        return {
          label: "Submitted for RFQ",
          bg: "rgba(124,136,155,.12)",
          border: "rgba(124,136,155,.28)",
          color: "#d7dee5"
        };
      case "estimating":
        return {
          label: "Reviewing / Estimating",
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
      case "awaiting_po":
        return {
          label: "Awaiting PO acceptance",
          bg: "rgba(214,135,52,.14)",
          border: "rgba(214,135,52,.34)",
          color: "#f0a85a"
        };
      case "designing":
        return {
          label: "Designing",
          bg: "rgba(65,145,255,.14)",
          border: "rgba(65,145,255,.34)",
          color: "#79b2ff"
        };
      case "awaiting_approval":
        return {
          label: "Awaiting approval",
          bg: "rgba(160,110,255,.14)",
          border: "rgba(160,110,255,.34)",
          color: "#b798ff"
        };
      case "drafting_pack":
        return {
          label: "Drafting pack",
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
      default:
        return {
          label: status || "Unknown",
          bg: "rgba(170,170,170,.10)",
          border: "rgba(170,170,170,.24)",
          color: "#d7dee5"
        };
    }
  }

  function getFileTypeLabel(file) {
    const name = (file.file_name || "").toLowerCase();

    if (name.endsWith(".pdf")) return "PDF";
    if (name.endsWith(".zip")) return "ZIP";
    if (name.endsWith(".dwg")) return "DWG";
    if (name.endsWith(".dxf")) return "DXF";
    if (name.endsWith(".step") || name.endsWith(".stp")) return "STEP";
    if (
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp")
    ) {
      return "Image";
    }

    return "File";
  }

  function normaliseSearchText(value) {
    return String(value || "").toLowerCase().trim();
  }

  function itemMatchesSearch(item, fields) {
    const term = normaliseSearchText(portalState.searchTerm);

    if (!term) {
      return true;
    }

    return fields.some(function (field) {
      return normaliseSearchText(item[field]).includes(term);
    });
  }

  function sortBySearchMatch(items, fields) {
    const term = normaliseSearchText(portalState.searchTerm);

    if (!term) {
      return items.slice();
    }

    const matched = [];
    const unmatched = [];

    items.forEach(function (item) {
      if (itemMatchesSearch(item, fields)) {
        matched.push(item);
      } else {
        unmatched.push(item);
      }
    });

    return matched.concat(unmatched);
  }

  function updateSearchStatus() {
    const statusEl = document.getElementById("portalSearchStatus");
    if (!statusEl) {
      return;
    }

    if (!normaliseSearchText(portalState.searchTerm)) {
      statusEl.textContent = "Showing all items";
      return;
    }

    statusEl.textContent = `Search active: ${portalState.searchTerm}`;
  }

  function renderJobs(jobs) {
    const el = document.getElementById("jobsCardContent");
    if (!el) return;

    if (!jobs || jobs.length === 0) {
      el.innerHTML = "<p>No jobs available yet</p>";
      return;
    }

    const sortedJobs = sortBySearchMatch(jobs, ["job_ref", "title", "status"]);
    const visibleJobs = portalState.searchTerm
      ? sortedJobs.filter(function (job) {
          return itemMatchesSearch(job, ["job_ref", "title", "status"]);
        })
      : sortedJobs;

    if (visibleJobs.length === 0) {
      el.innerHTML = "<p>No matching jobs</p>";
      return;
    }

    el.innerHTML = visibleJobs
      .map(function (job) {
        const status = getJobStatusMeta(job.status);

        const timestampLabel = job.started_at
          ? new Date(job.started_at).toLocaleString()
          : "";

        const relatedDocs = portalState.commercialFiles.filter(function (file) {
          return String(file.job_id) === String(job.id);
        });

        const latestQuote = relatedDocs.find(function (f) {
          return f.document_kind === "quote";
        });

        const latestPO = relatedDocs.find(function (f) {
          return f.document_kind === "po";
        });

        const latestInvoice = relatedDocs.find(function (f) {
          return f.document_kind === "invoice";
        });

        const companyName =
          portalState.profile?.role === "admin"
            ? (
                portalState.adminCompanies.find(function (company) {
                  return String(company.id) === String(job.company_id);
                })?.name || "Client"
              )
            : portalState.profile?.company_name || "Client";

        const rfqFiles = portalState.rfqFiles.filter(function (file) {
          return String(file.quote_request_id) === String(job.quote_request_id);
        });

        let nextStep = "";
        let actionHtml = "";
        let extraInfoHtml = "";

        if (job.status === "rfq_submitted") {
          extraInfoHtml = `
            <div style="margin-top:10px;font-size:.9rem;color:#a8b2bc">
              <strong>Client:</strong> ${companyName}
            </div>
            ${
              job.description
                ? `
              <div style="margin-top:8px;font-size:.9rem;color:#d7dee5;line-height:1.6">
                <strong>Design notes:</strong><br>${String(job.description).replace(/\n/g, "<br>")}
              </div>
            `
                : ""
            }
            ${
              job.preferred_materials
                ? `
              <div style="margin-top:8px;font-size:.9rem;color:#d7dee5;line-height:1.6">
                <strong>Preferred materials:</strong><br>${String(job.preferred_materials).replace(/\n/g, "<br>")}
              </div>
            `
                : ""
            }
            ${
              job.priority
                ? `
              <div style="margin-top:8px;font-size:.9rem;color:#a8b2bc">
                <strong>Priority:</strong> ${job.priority}
              </div>
            `
                : ""
            }
            ${
              rfqFiles.length
                ? `
              <div style="margin-top:10px">
                <div style="font-size:.9rem;color:#a8b2bc"><strong>Reference files:</strong></div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                  ${rfqFiles
                    .map(function (file) {
                      return `<a class="btn" href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer">${file.file_name}</a>`;
                    })
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          `;
        }

        if (job.status === "quoted") {
          nextStep = "Accept the issued quote to proceed";

          actionHtml = `
            <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
              ${
                latestQuote
                  ? `<a class="btn" href="${latestQuote.downloadUrl}" target="_blank" rel="noopener noreferrer">View Quote</a>`
                  : ""
              }
              <button class="btn btn-primary" data-accept-job="${job.id}">Accept Quote</button>
            </div>
          `;
        }

        if (job.status === "awaiting_po") {
          if (!latestPO) {
            nextStep = "Upload your purchase order to proceed";

            actionHtml = `
              <div style="margin-top:10px">
                ${
                  latestQuote
                    ? `<a class="btn" href="${latestQuote.downloadUrl}" target="_blank" rel="noopener noreferrer">View Quote</a>`
                    : ""
                }
                <div style="margin-top:10px">
                  <input type="file" data-po-input="${job.id}" accept=".pdf,.zip,.dwg,.dxf">
                  <button class="btn btn-primary" data-upload-po="${job.id}">Upload PO</button>
                </div>
              </div>
            `;
          } else {
const created = new Date(job.po_accepted_at).getTime();
            const now = Date.now();
            const elapsed = now - created;
            const withinWindow = elapsed < 30000;

            nextStep = withinWindow
              ? "Awaiting PO acceptance, you can amend for 30 seconds"
              : "PO accepted, reviewing live capacity and creating concept model.<br><br>Thank you for your business";

            if (!withinWindow) {
              status.label = "PO accepted";
              status.bg = "rgba(108,186,92,.14)";
              status.border = "rgba(108,186,92,.34)";
              status.color = "#8fda7d";
            }

            actionHtml = `
              <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
                ${
                  latestQuote
                    ? `<a class="btn" href="${latestQuote.downloadUrl}" target="_blank" rel="noopener noreferrer">View Quote</a>`
                    : ""
                }
                <a class="btn" href="${latestPO.downloadUrl}" target="_blank" rel="noopener noreferrer">View PO</a>
                ${
                  withinWindow
                    ? `<button class="btn" data-delete-po="${job.id}" data-path="${latestPO.storage_path}" data-id="${latestPO.id}">Delete PO</button>`
                    : ""
                }
              </div>
            `;
          }
        }

        if (job.status === "designing") {
          nextStep = "WMAS is progressing your order";
        }

        if (job.status === "awaiting_approval") {
          nextStep = "Review issued drawing pack and confirm approval";
        }

        if (job.status === "drafting_pack") {
          nextStep = "Final drawing pack is being prepared";
        }

        if (job.status === "complete") {
          nextStep = "Thank you for your business";

          actionHtml = `
            <div style="margin-top:10px">
              ${
                latestInvoice
                  ? `<a class="btn" href="${latestInvoice.downloadUrl}" target="_blank" rel="noopener noreferrer">View Invoice</a>`
                  : ""
              }
            </div>
          `;
        }
        return `
          <div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="font-weight:700;color:#edf1f4">${job.job_ref}</div>
            <div style="margin-top:4px;color:#edf1f4">${job.title}</div>
            <div style="margin-top:10px">
              ${badgeHtml(status.label, status.border, status.bg, status.color)}
            </div>
            ${extraInfoHtml}
            ${
              nextStep
                ? `<div style="margin-top:10px;font-size:.9rem;color:#a8b2bc"><strong>Next step:</strong> ${nextStep}</div>`
                : ""
            }
            ${actionHtml}
            ${
              timestampLabel
                ? `<div style="margin-top:8px;font-size:.82rem;color:#a8b2bc">${timestampLabel}</div>`
                : ""
            }
          </div>
        `;
      })
      .join("");

    setTimeout(function () {
      document.querySelectorAll("[data-accept-job]").forEach(function (btn) {
        btn.onclick = async function () {
          const jobId = btn.getAttribute("data-accept-job");
          const job = portalState.jobs.find(function (j) {
            return String(j.id) === String(jobId);
          });

          if (!job) return;

          const ok = await handleAcceptQuote(job, portalState.profile.id);
          if (ok) {
            await reloadPortalData();
          }
        };
      });

document.querySelectorAll("[data-upload-po]").forEach(function (btn) {
  btn.onclick = async function () {
    const jobId = btn.getAttribute("data-upload-po");
    const job = portalState.jobs.find(function (j) {
      return String(j.id) === String(jobId);
    });
    const input = document.querySelector(`[data-po-input="${jobId}"]`);

    if (!job || !input || !input.files || !input.files[0]) {
      return;
    }

    await handlePoUpload(job, portalState.profile, input.files[0]);
  };
});

      document.querySelectorAll("[data-delete-po]").forEach(function (btn) {
        btn.onclick = async function () {
          const jobId = btn.getAttribute("data-delete-po");
          const fileId = btn.getAttribute("data-id");
          const storagePath = btn.getAttribute("data-path");

          if (!jobId || !fileId || !storagePath) {
            return;
          }

          const confirmed = window.confirm(
            "Delete this PO and upload a replacement?"
          );
          if (!confirmed) {
            return;
          }

          await supabaseClient.storage
            .from("wmas-commercial-files")
            .remove([storagePath]);

          await supabaseClient
            .from("wmas_commercial_files")
            .delete()
            .eq("id", fileId);

          await supabaseClient
            .from("wmas_jobs")
            .update({ po_accepted_at: null })
            .eq("id", jobId);

          await reloadPortalData();
        };
      });
    }, 100);

    const awaitingPoJob = visibleJobs.find(function (job) {
      if (job.status !== "awaiting_po") return false;

      const poDoc = portalState.commercialFiles.find(function (file) {
        return String(file.job_id) === String(job.id) && file.document_kind === "po";
      });

      if (!poDoc) return false;

      const created = job.po_accepted_at
        ? new Date(job.po_accepted_at).getTime()
        : new Date(poDoc.created_at).getTime();

      return Date.now() - created < 30000;
    });

    if (awaitingPoJob) {
      setTimeout(function () {
        reloadPortalData();
      }, 32000);
    }
  }

  function renderFiles(files) {
    const el = document.getElementById("filesCardContent");
    if (!el) {
      return;
    }

    if (!files || files.length === 0) {
      el.innerHTML = "<p>No files available yet</p>";
      return;
    }

    const sortedFiles = sortBySearchMatch(files, ["title", "file_name", "revision"]);
    const matchingFiles = portalState.searchTerm
      ? sortedFiles.filter(function (file) {
          return itemMatchesSearch(file, ["title", "file_name", "revision"]);
        })
      : sortedFiles;

    const visibleFiles = portalState.showAllFiles
      ? matchingFiles
      : matchingFiles.slice(0, 6);

    if (visibleFiles.length === 0) {
      el.innerHTML = "<p>No matching technical files</p>";
      return;
    }

    el.innerHTML = visibleFiles
      .map(function (file) {
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
      })
      .join("");
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

    const sortedFiles = sortBySearchMatch(files, ["title", "file_name", "document_kind"]);
    const visibleFiles = portalState.searchTerm
      ? sortedFiles.filter(function (file) {
          return itemMatchesSearch(file, ["title", "file_name", "document_kind"]);
        })
      : sortedFiles;

    if (visibleFiles.length === 0) {
      el.innerHTML = "<p>No matching commercial documents</p>";
      return;
    }

    const filesByJob = {};

    visibleFiles.forEach(function (file) {
      const key = file.job_id || "unassigned";
      if (!filesByJob[key]) {
        filesByJob[key] = [];
      }
      filesByJob[key].push(file);
    });

    el.innerHTML = Object.keys(filesByJob)
      .map(function (jobId) {
        const job = portalState.jobs.find(function (j) {
          return String(j.id) === String(jobId);
        });

        const jobTitle = job ? `${job.job_ref} | ${job.title}` : "General Files";
        const jobFiles = filesByJob[jobId];

        return `
          <div style="margin-bottom:16px">
            <div style="font-weight:700;color:#79b2ff;margin-bottom:6px">
              ${jobTitle}
            </div>
            ${jobFiles
              .map(function (file) {
                const kindLabel = (file.document_kind || "document").toUpperCase();
                const revisionLabel = file.revision ? `Rev ${file.revision}` : "Rev -";

                return `
                  <div style="padding:10px 0;border-top:1px solid rgba(255,255,255,.06)">
                    <div style="font-weight:600;color:#edf1f4">${file.title}</div>
                    <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                      ${badgeHtml(kindLabel, "rgba(214,135,52,.28)", "rgba(214,135,52,.12)", "#f0a85a")}
                      ${badgeHtml(revisionLabel, "rgba(124,136,155,.28)", "rgba(124,136,155,.12)", "#d7dee5")}
                    </div>
                    <div style="margin-top:6px;font-size:.9rem;color:#a8b2bc">${file.file_name}</div>
                    <div style="margin-top:8px">
                      <a class="btn" href="${file.downloadUrl}" target="_blank" rel="noopener noreferrer">Download</a>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      })
      .join("");
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

    const sortedMessages = sortBySearchMatch(messages, ["subject", "message_body", "sender_role"]);
    const visibleMessages = portalState.searchTerm
      ? sortedMessages.filter(function (message) {
          return itemMatchesSearch(message, ["subject", "message_body", "sender_role"]);
        })
      : sortedMessages;

    if (visibleMessages.length === 0) {
      el.innerHTML = "<p>No matching messages</p>";
      return;
    }

    el.innerHTML = visibleMessages
      .map(function (message) {
        const senderLabel = message.is_system
          ? "System"
          : message.sender_role === "admin"
          ? "WMAS"
          : "Client";

        let rfqId = null;
        let requestRef = null;
        const rawBody = message.message_body || "";
        const subject = message.subject || "";

        if (rawBody.startsWith("RFQ_ID:")) {
          const firstLine = rawBody.split("\n")[0];
          rfqId = firstLine.replace("RFQ_ID:", "").trim();
        }

        const subjectMatch = subject.match(/QR-\d+/);
        if (subjectMatch) {
          requestRef = subjectMatch[0];
        }

        const formattedBody = rawBody
          .replace(/^RFQ_ID:.*\n/, "")
          .replace(/\n/g, "<br>");

        return `
          <div style="padding:12px 14px 12px 0;border-top:1px solid rgba(255,255,255,.08)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div style="font-weight:700;color:#edf1f4">${subject || "Message"}</div>
              <div style="font-size:.84rem;color:#a8b2bc">${senderLabel}</div>
            </div>
            <div style="margin-top:8px;color:#d7dee5;line-height:1.7">${formattedBody}</div>
            ${
              portalState.profile?.role === "admin" &&
              (rfqId || requestRef) &&
              !portalState.jobs.some(function (j) {
                return String(j.quote_request_id) === String(rfqId);
              })
                ? `<div style="margin-top:10px"><button class="btn" data-rfq="${rfqId || ""}" data-request-ref="${requestRef || ""}">Create Job from RFQ</button></div>`
                : ""
            }
            <div style="margin-top:8px;font-size:.82rem;color:#a8b2bc">${new Date(message.created_at).toLocaleString()}</div>
          </div>
        `;
      })
      .join("");
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

    portalState.technicalFiles = filesWithUrls;
    renderFiles(portalState.technicalFiles);

    const expandBtn = document.getElementById("filesExpandBtn");
    if (expandBtn) {
      expandBtn.onclick = function () {
        portalState.showAllFiles = !portalState.showAllFiles;
        expandBtn.textContent = portalState.showAllFiles ? "Show less" : "View all";
        renderFiles(portalState.technicalFiles);
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

    portalState.commercialFiles = docsWithUrls;
    renderCommercial(portalState.commercialFiles);
    return portalState.commercialFiles;
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

    portalState.messages = data || [];
    renderMessages(portalState.messages);
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

    const targetCompanyId =
      profile.role === "admin"
        ? portalState.adminTargetCompany?.id || profile.company_id
        : profile.company_id;

    statusEl.textContent = "Sending message";

    const { error } = await supabaseClient
      .from("wmas_messages")
      .insert({
        company_id: targetCompanyId,
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
    await loadMessages(targetCompanyId);
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
      statusEl.textContent =
        "Thank you for ordering with WMAS. Next step, upload your purchase order now to secure capacity";
    }

    return true;
  }

  async function handlePoUpload(job, profile, file) {
    const statusEl = document.getElementById("commercialActionStatus");

    const existingPO = portalState.commercialFiles.find(function (f) {
      return String(f.job_id) === String(job.id) && f.document_kind === "po";
    });

    if (existingPO) {
      if (statusEl) {
        statusEl.textContent = "A purchase order is already uploaded for this job";
      }
      return false;
    }

    if (!file) {
      if (statusEl) {
        statusEl.textContent = "Choose a PO file before uploading";
      }
      return false;
    }

    const safeFileName = file.name.replace(/\s+/g, "_");

    const companyFolder =
      profile.role === "admin"
        ? portalState.adminTargetCompany?.slug
        : profile.company_slug;

    if (!companyFolder) {
      if (statusEl) {
        statusEl.textContent = "Unable to determine company storage folder";
      }
      return false;
    }

    const objectPath = `${companyFolder}/${job.job_ref}_${safeFileName}`;

    if (statusEl) {
      statusEl.textContent = "Uploading purchase order";
    }

    const uploadResult = await supabaseClient.storage
      .from("wmas-commercial-files")
      .upload(objectPath, file, { upsert: false });

    if (uploadResult.error) {
      console.error("PO storage upload error", uploadResult.error);
      if (statusEl) {
        statusEl.textContent = `Storage upload failed: ${uploadResult.error.message || "Unknown error"}`;
      }
      return false;
    }

    const insertResult = await supabaseClient
      .from("wmas_commercial_files")
      .insert({
        company_id: job.company_id,
        job_id: job.id,
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
      console.error("PO row insert error", insertResult.error);
      if (statusEl) {
        statusEl.textContent = `PO row insert failed: ${insertResult.error.message || "Unknown error"}`;
      }
      return false;
    }

    await supabaseClient
  .from("wmas_jobs")
  .update({
    po_accepted_at: new Date().toISOString()
  })
  .eq("id", job.id);
    
    await insertJobEvent(
      job,
      "po_uploaded",
      "Purchase order uploaded",
      "Client uploaded a purchase order",
      profile.id
    );

    if (statusEl) {
      statusEl.textContent = "PO uploaded, awaiting WMAS review";
    }

    await reloadPortalData();
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

    actionArea.innerHTML = "";
    statusEl.textContent = "No current action";
  }

  async function loadAdminCompanies() {
    const selectEl = document.getElementById("adminCompanySelect");
    if (!selectEl) {
      return;
    }

    const { data, error } = await supabaseClient
      .from("wmas_companies")
      .select("id, name, slug")
      .neq("slug", "wmas-engineering")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      selectEl.innerHTML = `<option value="">Unable to load client companies</option>`;
      portalState.adminCompanies = [];
      portalState.adminTargetCompany = null;
      return;
    }

    portalState.adminCompanies = data || [];

    if (!portalState.adminCompanies.length) {
      selectEl.innerHTML = `<option value="">No client companies available</option>`;
      portalState.adminTargetCompany = null;
      return;
    }

    selectEl.innerHTML = portalState.adminCompanies
      .map(function (company) {
        return `<option value="${company.id}">${company.name}</option>`;
      })
      .join("");

    portalState.adminTargetCompany = portalState.adminCompanies[0];
    selectEl.value = portalState.adminTargetCompany.id;

    selectEl.onchange = async function () {
      const selectedId = selectEl.value;
      portalState.adminTargetCompany =
        portalState.adminCompanies.find(function (company) {
          return company.id === selectedId;
        }) || null;

      const subtextEl = document.getElementById("portalSubtext");
      if (subtextEl && portalState.adminTargetCompany) {
        subtextEl.textContent = `Admin access is active. Current target company: ${portalState.adminTargetCompany.name}`;
      }

      await reloadPortalData();
    };
  }

  async function handleAdminCommercialFiles() {
    const companySelect = document.getElementById("adminCommercialCompany");
    const fileSelect = document.getElementById("adminCommercialFile");
    const deleteBtn = document.getElementById("adminDeleteCommercialBtn");
    const statusEl = document.getElementById("adminCommercialStatus");

    if (!companySelect || !fileSelect || !deleteBtn || !statusEl) {
      return;
    }

    function loadCompanies() {
      companySelect.innerHTML = portalState.adminCompanies
        .map(function (company) {
          return `<option value="${company.id}">${company.name}</option>`;
        })
        .join("");

      if (portalState.adminTargetCompany) {
        companySelect.value = portalState.adminTargetCompany.id;
      }
    }

    async function loadFilesForCompany() {
      const companyId = companySelect.value;

      const { data: files } = await supabaseClient
        .from("wmas_commercial_files")
        .select("id, title, file_name, storage_path")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      fileSelect.innerHTML = (files || [])
        .map(function (file) {
          return `<option value="${file.id}" data-path="${file.storage_path}">${file.title} | ${file.file_name}</option>`;
        })
        .join("");

      if (!files || !files.length) {
        fileSelect.innerHTML = `<option value="">No files found</option>`;
      }
    }

    companySelect.onchange = async function () {
      await loadFilesForCompany();
    };

    deleteBtn.onclick = async function () {
      const fileId = fileSelect.value;
      const selected = fileSelect.selectedOptions[0];
      const storagePath = selected ? selected.getAttribute("data-path") : "";

      if (!fileId || !storagePath) {
        statusEl.textContent = "Select a file";
        return;
      }

      const confirmed = window.confirm("Delete this commercial file?");
      if (!confirmed) {
        return;
      }

      statusEl.textContent = "Deleting file";

      const deleteStorageResult = await supabaseClient.storage
        .from("wmas-commercial-files")
        .remove([storagePath]);

      if (deleteStorageResult.error) {
        statusEl.textContent =
          deleteStorageResult.error.message || "Unable to delete file from storage";
        return;
      }

      const deleteRowResult = await supabaseClient
        .from("wmas_commercial_files")
        .delete()
        .eq("id", fileId);

      if (deleteRowResult.error) {
        statusEl.textContent =
          deleteRowResult.error.message || "Unable to delete file record";
        return;
      }

      statusEl.textContent = "File deleted";
      await reloadPortalData();
      await loadFilesForCompany();
    };

    loadCompanies();
    await loadFilesForCompany();
  }

  async function handleAdminManageJobs() {
    const companySelect = document.getElementById("adminManageCompany");
    const jobSelect = document.getElementById("adminManageJob");
    const statusSelect = document.getElementById("adminManageStatus");
    const updateBtn = document.getElementById("adminUpdateJobBtn");
    const deleteBtn = document.getElementById("adminDeleteJobBtn");
    const notice = document.getElementById("adminManageStatusNotice");

    if (!companySelect || !jobSelect || !statusSelect || !updateBtn || !deleteBtn || !notice) {
      return;
    }

    function loadCompanies() {
      companySelect.innerHTML = portalState.adminCompanies
        .map(function (company) {
          return `<option value="${company.id}">${company.name}</option>`;
        })
        .join("");

      if (portalState.adminTargetCompany) {
        companySelect.value = portalState.adminTargetCompany.id;
      }
    }

    async function loadJobsForCompany() {
      const companyId = companySelect.value;

      const { data: jobs } = await supabaseClient
        .from("wmas_jobs")
        .select("id, job_ref, title, status")
        .eq("company_id", companyId)
        .order("started_at", { ascending: false });

      jobSelect.innerHTML = (jobs || [])
        .map(function (job) {
          return `<option value="${job.id}" data-status="${job.status}">${job.job_ref} | ${job.title} | ${job.status}</option>`;
        })
        .join("");

      const selected = jobSelect.selectedOptions[0];
      if (selected) {
        statusSelect.value = selected.getAttribute("data-status") || "estimating";
      }
    }

    companySelect.onchange = async function () {
      await loadJobsForCompany();
    };

    jobSelect.onchange = function () {
      const selected = jobSelect.selectedOptions[0];
      if (selected) {
        statusSelect.value = selected.getAttribute("data-status") || "estimating";
      }
    };

    updateBtn.onclick = async function () {
      const jobId = jobSelect.value;
      const newStatus = statusSelect.value;

      if (!jobId) {
        notice.textContent = "Select a job";
        return;
      }

      notice.textContent = "Updating job";

      const { error } = await supabaseClient
        .from("wmas_jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) {
        notice.textContent = error.message || "Update failed";
        return;
      }

      notice.textContent = "Job updated";
      await reloadPortalData();
      await loadJobsForCompany();
    };

    deleteBtn.onclick = async function () {
      const jobId = jobSelect.value;

      if (!jobId) {
        notice.textContent = "Select a job";
        return;
      }

      const confirmed = window.confirm("Delete this job? This cannot be undone");
      if (!confirmed) {
        return;
      }

      notice.textContent = "Deleting job";

      const { error } = await supabaseClient
        .from("wmas_jobs")
        .delete()
        .eq("id", jobId);

      if (error) {
        notice.textContent = error.message || "Delete failed";
        return;
      }

      notice.textContent = "Job deleted";
      await reloadPortalData();
      await loadJobsForCompany();
    };

    loadCompanies();
    await loadJobsForCompany();
  }

  async function loadJobs(companyId) {
    const { data: jobsData, error: jobsError } = await supabaseClient
      .from("wmas_jobs")
      .select("id, company_id, quote_id, quote_request_id, job_ref, title, status, started_at, po_accepted_at")
      .eq("company_id", companyId)
      .order("started_at", { ascending: false });

    const { data: rfqData } = await supabaseClient
      .from("wmas_quote_requests")
      .select("id, company_id, request_ref, title, description, preferred_materials, priority, created_at, status")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (jobsError) {
      const el = document.getElementById("jobsCardContent");
      if (el) {
        el.textContent = "Unable to load jobs";
      }
      return [];
    }

    const rfqMap = new Map(
      (rfqData || []).map(function (rfq) {
        return [String(rfq.id), rfq];
      })
    );

    const linkedRfqIds = new Set(
      (jobsData || [])
        .map(function (job) {
          return job.quote_request_id;
        })
        .filter(Boolean)
    );

    const rfqAsJobs = (rfqData || [])
      .filter(function (rfq) {
        return !linkedRfqIds.has(rfq.id);
      })
      .map(function (rfq) {
        return {
          id: `rfq-${rfq.id}`,
          company_id: rfq.company_id,
          quote_id: null,
          quote_request_id: rfq.id,
          job_ref: rfq.request_ref,
          title: rfq.title,
          status: "rfq_submitted",
          started_at: rfq.created_at,
          description: rfq.description,
          preferred_materials: rfq.preferred_materials,
          priority: rfq.priority
        };
      });

    const enrichedJobs = (jobsData || []).map(function (job) {
      const rfq = job.quote_request_id
        ? rfqMap.get(String(job.quote_request_id))
        : null;

      return {
        ...job,
        description: rfq?.description || "",
        preferred_materials: rfq?.preferred_materials || "",
        priority: rfq?.priority || ""
      };
    });

    const combined = rfqAsJobs.concat(enrichedJobs).sort(function (a, b) {
      return new Date(b.started_at) - new Date(a.started_at);
    });

    portalState.jobs = combined;
    return portalState.jobs;
  }

  async function loadRfqFiles(companyId) {
    const { data, error } = await supabaseClient
      .from("wmas_quote_request_files")
      .select("id, quote_request_id, title, file_name, storage_path, file_type, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      portalState.rfqFiles = [];
      return [];
    }

    const filesWithUrls = await Promise.all(
      (data || []).map(async function (file) {
        const { data: signedData } = await supabaseClient.storage
          .from("wmas-quote-request-files")
          .createSignedUrl(file.storage_path, 3600);

        return {
          ...file,
          downloadUrl: signedData?.signedUrl || "#"
        };
      })
    );

    portalState.rfqFiles = filesWithUrls;
    return portalState.rfqFiles;
  }

  async function handleAdminCreateJob() {
    const btn = document.getElementById("adminCreateJobBtn");
    const notice = document.getElementById("adminJobStatusNotice");
    const refEl = document.getElementById("adminJobRef");
    const titleEl = document.getElementById("adminJobTitle");
    const statusEl = document.getElementById("adminJobStatus");

    if (!btn || !notice || !refEl || !titleEl || !statusEl) {
      return;
    }

    if (!portalState.profile || portalState.profile.role !== "admin") {
      return;
    }

    btn.onclick = async function () {
      const jobRef = refEl.value.trim();
      const title = titleEl.value.trim();
      const status = statusEl.value;

      if (!jobRef || !title) {
        notice.textContent = "Enter a job reference and job title";
        return;
      }

      if (!portalState.adminTargetCompany) {
        notice.textContent = "Select a client company first";
        return;
      }

      notice.textContent = "Creating job";

      const { error } = await supabaseClient
        .from("wmas_jobs")
        .insert({
          company_id: portalState.adminTargetCompany.id,
          job_ref: jobRef,
          title: title,
          description: "Portal created job",
          status: status,
          quote_request_id: null,
          created_by: portalState.profile.id,
          started_at: new Date().toISOString()
        });

      if (error) {
        notice.textContent = error.message || "Unable to create job";
        return;
      }

      notice.textContent = `Job created for ${portalState.adminTargetCompany.name}`;
      refEl.value = "";
      titleEl.value = "";
      statusEl.value = "estimating";

      await reloadPortalData();
    };
  }

  async function submitQuoteRequest() {
    const statusEl = document.getElementById("quoteRequestStatus");
    const titleEl = document.getElementById("quoteRequestTitle");
    const descriptionEl = document.getElementById("quoteRequestDescription");
    const materialsEl = document.getElementById("quoteRequestMaterials");
    const priorityEl = document.getElementById("quoteRequestPriority");
    const filesEl = document.getElementById("quoteRequestFiles");

    if (!statusEl || !titleEl || !descriptionEl || !materialsEl || !priorityEl || !filesEl) {
      return;
    }

    if (!portalState.profile || portalState.profile.role !== "client") {
      statusEl.textContent = "Quote requests are currently client actions only";
      return;
    }

    const title = titleEl.value.trim();
    const description = descriptionEl.value.trim();
    const preferredMaterials = materialsEl.value.trim();
    const priority = priorityEl.value;
    const files = Array.from(filesEl.files || []);

    if (!title) {
      statusEl.textContent = "Enter a project title";
      return;
    }

    statusEl.textContent = "Submitting quote request";

    const requestRef = `QR-${Date.now()}`;

    const { data: requestRow, error: requestError } = await supabaseClient
      .from("wmas_quote_requests")
      .insert({
        company_id: portalState.profile.company_id,
        requester_profile_id: portalState.profile.id,
        request_ref: requestRef,
        title: title,
        description: description,
        preferred_materials: preferredMaterials,
        priority: priority,
        status: "rfq_submitted",
        admin_alert: true
      })
      .select("id")
      .single();

    if (requestError || !requestRow) {
      statusEl.textContent = requestError?.message || "Unable to create quote request";
      return;
    }

    const quoteRequestId = requestRow.id;
    const companyFolder = portalState.profile.company_slug;
    const uploadedPaths = [];
    const insertedFileIds = [];

    if (!companyFolder) {
      statusEl.textContent = "Unable to determine company storage folder";
      return;
    }

    for (const file of files) {
      const safeFileName = file.name.replace(/\s+/g, "_");
      const objectPath = `${companyFolder}/${requestRef}_${safeFileName}`;

      const uploadResult = await supabaseClient.storage
        .from("wmas-quote-request-files")
        .upload(objectPath, file, { upsert: false });

      if (uploadResult.error) {
        if (insertedFileIds.length) {
          await supabaseClient
            .from("wmas_quote_request_files")
            .delete()
            .in("id", insertedFileIds);
        }

        if (uploadedPaths.length) {
          await supabaseClient.storage
            .from("wmas-quote-request-files")
            .remove(uploadedPaths);
        }

        await supabaseClient
          .from("wmas_quote_requests")
          .delete()
          .eq("id", quoteRequestId);

        statusEl.textContent = uploadResult.error.message || "A file upload failed";
        return;
      }

      uploadedPaths.push(objectPath);

      const fileInsert = await supabaseClient
        .from("wmas_quote_request_files")
        .insert({
          quote_request_id: requestRow.id,
          company_id: portalState.profile.company_id,
          title: file.name,
          file_name: file.name,
          storage_path: objectPath,
          file_type: file.type || "application/octet-stream",
          uploaded_by: portalState.profile.id
        })
        .select("id")
        .single();

      if (fileInsert.error) {
        if (uploadedPaths.length) {
          await supabaseClient.storage
            .from("wmas-quote-request-files")
            .remove(uploadedPaths);
        }

        if (insertedFileIds.length) {
          await supabaseClient
            .from("wmas_quote_request_files")
            .delete()
            .in("id", insertedFileIds);
        }

        await supabaseClient
          .from("wmas_quote_requests")
          .delete()
          .eq("id", quoteRequestId);

        statusEl.textContent =
          fileInsert.error.message || "Unable to register an uploaded file";
        return;
      }

      insertedFileIds.push(fileInsert.data.id);
    }

    titleEl.value = "";
    descriptionEl.value = "";
    materialsEl.value = "";
    priorityEl.value = "normal";
    filesEl.value = "";

    statusEl.textContent = `Quote request submitted: ${requestRef}`;

    await supabaseClient
      .from("wmas_messages")
      .insert({
        company_id: portalState.profile.company_id,
        sender_profile_id: portalState.profile.id,
        sender_role: "client",
        subject: `${requestRef} | ${title}`,
        message_body: `RFQ_ID:${quoteRequestId}\nA new quote request has been submitted.\n\nReference: ${requestRef}\nTitle: ${title}\nPriority: ${priority}${preferredMaterials ? `\nPreferred materials: ${preferredMaterials}` : ""}`,
        is_system: false
      });

    await loadMessages(portalState.profile.company_id);
  }

  function bindSearch() {
    const input = document.getElementById("portalSearchInput");
    if (!input) {
      return;
    }

    input.addEventListener("input", function () {
      portalState.searchTerm = input.value || "";
      updateSearchStatus();
      renderJobs(portalState.jobs);
      renderFiles(portalState.technicalFiles);
      renderCommercial(portalState.commercialFiles);
      renderMessages(portalState.messages);
    });
  }

  async function reloadPortalData() {
    if (!portalState.profile) {
      return;
    }

    const companyId =
      portalState.profile.role === "admin"
        ? portalState.adminTargetCompany?.id || portalState.profile.company_id
        : portalState.profile.company_id;

    const jobs = await loadJobs(companyId);
    await loadRfqFiles(companyId);
    await loadFiles(companyId);
    await loadCommercial(companyId);
    renderJobs(portalState.jobs);
    await loadMessages(companyId);

    setTimeout(function () {
      document.querySelectorAll("[data-rfq]").forEach(function (btn) {
        btn.onclick = async function () {
          let rfqId = btn.getAttribute("data-rfq");
          const requestRef = btn.getAttribute("data-request-ref");

          let rfqQuery = supabaseClient
            .from("wmas_quote_requests")
            .select("id, title, company_id, request_ref");

          if (rfqId) {
            rfqQuery = rfqQuery.eq("id", rfqId);
          } else {
            rfqQuery = rfqQuery.eq("request_ref", requestRef);
          }

          const { data: rfq } = await rfqQuery.single();

          if (!rfq) return;

          btn.disabled = true;
          btn.textContent = "Creating...";

          const { data: existingJob } = await supabaseClient
            .from("wmas_jobs")
            .select("id")
            .eq("quote_request_id", rfq.id)
            .maybeSingle();

          if (existingJob) {
            await reloadPortalData();
            return;
          }

          const jobRef = `WM${Date.now().toString().slice(-6)}`;

          await supabaseClient
            .from("wmas_jobs")
            .insert({
              company_id: rfq.company_id,
              job_ref: jobRef,
              title: rfq.title,
              description: "Created from RFQ",
              status: "estimating",
              quote_request_id: rfq.id,
              created_by: portalState.profile.id,
              started_at: new Date().toISOString()
            });

          await supabaseClient
            .from("wmas_quote_requests")
            .update({ status: "in_progress" })
            .eq("id", rfq.id);

          await reloadPortalData();
        };
      });
    }, 300);

    updateSearchStatus();

    if (portalState.profile.role === "admin") {
      const actionArea = document.getElementById("commercialActionArea");
      const statusEl = document.getElementById("commercialActionStatus");

      if (actionArea) {
        actionArea.innerHTML = "";
      }

      if (statusEl) {
        statusEl.textContent =
          "Admin commercial actions are managed from the admin panels above";
      }
    } else {
      const activeCommercialJob =
        jobs.find(function (job) {
          return job.status === "quoted" || job.status === "awaiting_po";
        }) || null;

      renderCommercialActions(
        activeCommercialJob,
        portalState.profile,
        reloadPortalData
      );
    }
  }

  async function handlePortalPage() {
    const welcomeEl = document.getElementById("portalWelcome");
    const subtextEl = document.getElementById("portalSubtext");
    const signOutBtn = document.getElementById("portalSignOut");
    const adminPanelWrap = document.getElementById("adminPanelWrap");

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

    let companySlug = null;
    let companyName = null;

    if (profile.company_id) {
      const { data: companyRow } = await supabaseClient
        .from("wmas_companies")
        .select("name, slug")
        .eq("id", profile.company_id)
        .single();

      companySlug = companyRow?.slug || null;
      companyName = companyRow?.name || null;
    }

    portalState.profile = {
      ...profile,
      company_slug: companySlug,
      company_name: companyName
    };

    if (profile.role === "admin") {
      if (adminPanelWrap) {
        adminPanelWrap.style.display = "grid";
      }
      await loadAdminCompanies();

      if (portalState.adminTargetCompany) {
        subtextEl.textContent = `Admin access is active. Current target company: ${portalState.adminTargetCompany.name}`;
      } else {
        subtextEl.textContent =
          "Admin access is active. No client company is currently available";
      }
    } else {
      subtextEl.textContent =
        "Client access is active. Your projects, files and messages are ready below";
    }

    welcomeEl.textContent = `Welcome, ${profile.full_name || "Client"}`;

    bindSearch();
    await reloadPortalData();
    await handleAdminCreateJob();
    await handleAdminManageJobs();
    await handleAdminCommercialFiles();

    if (portalState.profile.role === "admin") {
      const clientForm = document.getElementById("requestQuoteCard");
      const adminPanel = document.getElementById("adminQuotePanel");

      if (clientForm) clientForm.style.display = "none";
      if (adminPanel) adminPanel.style.display = "block";

      const companySelect = document.getElementById("adminQuoteCompany");
      const jobSelect = document.getElementById("adminQuoteJob");
      const issueBtn = document.getElementById("adminIssueQuoteBtn");
      const statusEl = document.getElementById("adminQuoteStatus");

      async function loadAdminQuoteJobs() {
        if (!companySelect || !jobSelect) return;

        const companyId = companySelect.value;

        const { data: jobs } = await supabaseClient
          .from("wmas_jobs")
          .select("id, job_ref, title")
          .eq("company_id", companyId)
          .order("started_at", { ascending: false });

        jobSelect.innerHTML = (jobs || [])
          .map(function (job) {
            return `<option value="${job.id}">${job.job_ref} | ${job.title}</option>`;
          })
          .join("");
      }

      if (companySelect) {
        companySelect.innerHTML = portalState.adminCompanies
          .map(function (company) {
            return `<option value="${company.id}">${company.name}</option>`;
          })
          .join("");

        if (portalState.adminTargetCompany) {
          companySelect.value = portalState.adminTargetCompany.id;
        }

        companySelect.onchange = async function () {
          await loadAdminQuoteJobs();
        };

        await loadAdminQuoteJobs();
      }

      if (issueBtn) {
        issueBtn.onclick = async function () {
          const companyId = companySelect?.value || "";
          const jobId = jobSelect?.value || "";
          const title =
            document.getElementById("adminQuoteTitle")?.value.trim() || "";
          const file =
            document.getElementById("adminQuoteFile")?.files?.[0] || null;

          if (!companyId || !jobId || !file) {
            if (statusEl) statusEl.textContent = "Select company, job and file";
            return;
          }

          if (statusEl) statusEl.textContent = "Uploading quote";

          const safeFileName = file.name.replace(/\s+/g, "_");

          const { data: companyRow } = await supabaseClient
            .from("wmas_companies")
            .select("slug")
            .eq("id", companyId)
            .single();

          const { data: jobRow } = await supabaseClient
            .from("wmas_jobs")
            .select("job_ref")
            .eq("id", jobId)
            .single();

          if (!companyRow?.slug || !jobRow?.job_ref) {
            if (statusEl) {
              statusEl.textContent =
                "Unable to determine company or job reference";
            }
            return;
          }

          const objectPath = `${companyRow.slug}/${jobRow.job_ref}_${safeFileName}`;

          const uploadResult = await supabaseClient.storage
            .from("wmas-commercial-files")
            .upload(objectPath, file, { upsert: false });

          if (uploadResult.error) {
            if (statusEl) {
              statusEl.textContent = uploadResult.error.message || "Upload failed";
            }
            return;
          }

          const insertResult = await supabaseClient
            .from("wmas_commercial_files")
            .insert({
              company_id: companyId,
              job_id: jobId,
              title: title || `${jobRow.job_ref} Quote`,
              document_kind: "quote",
              file_name: file.name,
              storage_path: objectPath,
              file_type: file.type || "application/pdf",
              revision: "A",
              visible_to_client: true,
              uploaded_by: portalState.profile.id,
              status: "issued",
              sort_order: 10
            });

          if (insertResult.error) {
            if (statusEl) {
              statusEl.textContent =
                insertResult.error.message || "Unable to register quote";
            }
            return;
          }

          const updateResult = await supabaseClient
            .from("wmas_jobs")
            .update({ status: "quoted" })
            .eq("id", jobId);

          if (updateResult.error) {
            if (statusEl) {
              statusEl.textContent =
                updateResult.error.message || "Unable to update job";
            }
            return;
          }

          await supabaseClient
            .from("wmas_messages")
            .insert({
              company_id: companyId,
              sender_profile_id: portalState.profile.id,
              sender_role: "admin",
              subject: `${jobRow.job_ref} Quote Issued`,
              message_body: `A quote has been issued for ${jobRow.job_ref}.\n\nPlease review the document in the Commercial section and accept to proceed.`,
              is_system: false
            });

          if (statusEl) statusEl.textContent = "Quote issued";

          const quoteTitleEl = document.getElementById("adminQuoteTitle");
          const quoteFileEl = document.getElementById("adminQuoteFile");

          if (quoteTitleEl) quoteTitleEl.value = "";
          if (quoteFileEl) quoteFileEl.value = "";

          await reloadPortalData();
        };
      }
    }

    const sendPortalMessageBtn = document.getElementById("sendPortalMessageBtn");
    if (sendPortalMessageBtn) {
      sendPortalMessageBtn.onclick = async function () {
        await sendMessage(portalState.profile);
      };
    }

    const submitQuoteRequestBtn = document.getElementById("submitQuoteRequestBtn");
    if (submitQuoteRequestBtn) {
      submitQuoteRequestBtn.onclick = async function () {
        await submitQuoteRequest();
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
