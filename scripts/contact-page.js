(() => {
  "use strict";

  class NexgearSupportPage {
    constructor(root = document) {
      this.root = root;
      this.searchInput = root.querySelector("#support-query");
      this.searchSuggestions = [...root.querySelectorAll("[data-search-term]")];
      this.searchables = [...root.querySelectorAll("[data-searchable]")];
      this.searchResult = root.querySelector("[data-search-result]");
      this.faqFilters = [...root.querySelectorAll("[data-faq-filter]")];
      this.faqItems = [...root.querySelectorAll("[data-faq-item]")];
      this.form = root.querySelector("[data-support-form]");
      this.formStatus = root.querySelector("[data-form-status]");
      this.fileInput = root.querySelector("[data-support-files]");
      this.fileList = root.querySelector("[data-file-list]");
      this.characterCount = root.querySelector("[data-character-count]");
      this.ticketSuccess = root.querySelector("[data-ticket-success]");
      this.ticketId = root.querySelector("[data-ticket-id]");
      this.summaryTitle = root.querySelector("[data-summary-title]");
      this.summaryTopic = root.querySelector("[data-summary-topic]");
      this.summaryProduct = root.querySelector("[data-summary-product]");
      this.selectedFiles = [];
      this.activeFaqFilter = "all";

      this.init();
    }

    init() {
      this.bindSearch();
      this.bindKeyboardShortcut();
      this.bindFaq();
      this.bindForm();
      this.bindFiles();
      this.updateSummary();
    }

    normalize(value = "") {
      return value
        .toLocaleLowerCase("id-ID")
        .trim()
        .replace(/\s+/g, " ");
    }

    bindSearch() {
      if (!this.searchInput) return;

      this.searchInput.addEventListener("input", () => {
        this.filterSearchResults(this.searchInput.value);
      });

      this.searchSuggestions.forEach((button) => {
        button.addEventListener("click", () => {
          const term = button.dataset.searchTerm || "";
          this.searchInput.value = term;
          this.searchInput.focus();
          this.filterSearchResults(term);
        });
      });
    }

    filterSearchResults(rawQuery) {
      const query = this.normalize(rawQuery);
      let matches = 0;

      this.searchables.forEach((item) => {
        const source = this.normalize(
          `${item.dataset.searchable || ""} ${item.textContent || ""}`,
        );
        const isFaq = item.matches("[data-faq-item]");
        const matchesQuery = !query || source.includes(query);
        const matchesCategory =
          !isFaq ||
          this.activeFaqFilter === "all" ||
          item.dataset.category === this.activeFaqFilter;
        const visible = matchesQuery && matchesCategory;

        item.hidden = !visible;
        item.dataset.searchState = visible ? "match" : "hidden";
        if (visible) matches += 1;
      });

      if (this.searchResult) {
        this.searchResult.textContent = query
          ? `${matches} hasil bantuan ditemukan untuk “${rawQuery.trim()}”.`
          : "";
      }
    }

    bindKeyboardShortcut() {
      document.addEventListener("keydown", (event) => {
        const tagName = document.activeElement?.tagName;
        const isTyping = tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";

        if (event.key === "/" && !isTyping && this.searchInput) {
          event.preventDefault();
          this.searchInput.focus();
        }
      });
    }

    bindFaq() {
      this.root.querySelectorAll("[data-faq-trigger]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
          const item = trigger.closest("[data-faq-item]");
          const answerId = trigger.getAttribute("aria-controls");
          const answer = answerId ? this.root.getElementById(answerId) : null;
          if (!item || !answer) return;

          const shouldOpen = item.dataset.state !== "open";
          this.closeFaqItems();

          if (shouldOpen) {
            item.dataset.state = "open";
            trigger.setAttribute("aria-expanded", "true");
            answer.hidden = false;
          }
        });
      });

      this.faqFilters.forEach((button) => {
        button.addEventListener("click", () => {
          this.activeFaqFilter = button.dataset.faqFilter || "all";

          this.faqFilters.forEach((filterButton) => {
            filterButton.dataset.state = filterButton === button ? "active" : "idle";
          });

          this.closeFaqItems();
          this.filterSearchResults(this.searchInput?.value || "");
        });
      });
    }

    closeFaqItems() {
      this.faqItems.forEach((item) => {
        const trigger = item.querySelector("[data-faq-trigger]");
        const answer = item.querySelector("div[id]");
        item.dataset.state = "closed";
        trigger?.setAttribute("aria-expanded", "false");
        if (answer) answer.hidden = true;
      });
    }

    bindForm() {
      if (!this.form) return;

      this.form.addEventListener("input", () => {
        this.updateSummary();
        this.updateCharacterCount();
      });

      this.form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!this.form.checkValidity()) {
          this.form.reportValidity();
          this.setFormStatus(
            "Periksa kembali field wajib sebelum mengirim tiket.",
            "error",
          );
          return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        const formData = new FormData(this.form);
        const ticket = this.createTicket(formData);

        this.form.dataset.state = "submitting";
        submitButton.disabled = true;
        this.setFormStatus("Sedang membuat support ticket...", "loading");

        await new Promise((resolve) => window.setTimeout(resolve, 700));

        try {
          this.saveTicket(ticket);
          this.form.dataset.state = "success";
          this.setFormStatus(
            `Tiket ${ticket.id} berhasil dibuat dan tersimpan di browser ini.`,
            "success",
          );
          this.showTicketSuccess(ticket.id);
          this.root.dispatchEvent(
            new CustomEvent("nexgear:support-ticket-created", {
              detail: { id: ticket.id, topic: ticket.topic },
            }),
          );
        } catch (error) {
          this.form.dataset.state = "error";
          this.setFormStatus(
            "Tiket tidak dapat disimpan. Periksa pengaturan penyimpanan browser.",
            "error",
          );
        } finally {
          submitButton.disabled = false;
        }
      });
    }

    updateSummary() {
      if (!this.form) return;

      const topic = this.form.elements.topic;
      const selectedTopic = topic?.options[topic.selectedIndex]?.text || "Belum dipilih";
      const subject = this.form.elements.subject?.value.trim();
      const product = this.form.elements.product?.value.trim();

      if (this.summaryTopic) {
        this.summaryTopic.textContent = topic?.value ? selectedTopic : "Belum dipilih";
      }
      if (this.summaryTitle) {
        this.summaryTitle.textContent = subject || "Permintaan bantuan baru";
      }
      if (this.summaryProduct) {
        this.summaryProduct.textContent = product || "Belum ditentukan";
      }
    }

    updateCharacterCount() {
      if (!this.form || !this.characterCount) return;
      this.characterCount.textContent = String(this.form.elements.message?.value.length || 0);
    }

    createTicket(formData) {
      const now = new Date();
      const dateCode = [
        String(now.getFullYear()).slice(-2),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("");
      const randomCode = Math.floor(1000 + Math.random() * 9000);

      return {
        id: `NXG-${dateCode}-${randomCode}`,
        createdAt: now.toISOString(),
        topic: String(formData.get("topic") || ""),
        orderNumber: String(formData.get("orderNumber") || ""),
        product: String(formData.get("product") || ""),
        email: String(formData.get("email") || ""),
        subject: String(formData.get("subject") || ""),
        message: String(formData.get("message") || ""),
        attachments: this.selectedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
        status: "new",
      };
    }

    saveTicket(ticket) {
      const storageKey = "nexgearSupportTickets";
      const current = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      const next = [ticket, ...current].slice(0, 20);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    }

    showTicketSuccess(id) {
      if (!this.ticketSuccess || !this.ticketId) return;
      this.ticketId.textContent = id;
      this.ticketSuccess.hidden = false;
    }

    setFormStatus(message, state) {
      if (!this.formStatus) return;
      this.formStatus.textContent = message;
      this.formStatus.dataset.state = state;
    }

    bindFiles() {
      if (!this.fileInput || !this.fileList) return;

      this.fileInput.addEventListener("change", () => {
        const allowedTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
        const maxSize = 5 * 1024 * 1024;
        const incoming = [...(this.fileInput.files || [])];
        const validFiles = [];
        const rejected = [];

        incoming.forEach((file) => {
          if (!allowedTypes.has(file.type)) {
            rejected.push(`${file.name}: format tidak didukung`);
          } else if (file.size > maxSize) {
            rejected.push(`${file.name}: ukuran melebihi 5 MB`);
          } else if (validFiles.length < 3) {
            validFiles.push(file);
          }
        });

        this.selectedFiles = validFiles;
        this.renderFiles();

        if (rejected.length || incoming.length > 3) {
          this.setFormStatus(
            rejected[0] || "Maksimal tiga lampiran dapat dipilih.",
            "error",
          );
        }
      });
    }

    renderFiles() {
      this.fileList.replaceChildren();

      this.selectedFiles.forEach((file, index) => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        const removeButton = document.createElement("button");

        name.textContent = `${file.name} · ${this.formatFileSize(file.size)}`;
        removeButton.type = "button";
        removeButton.textContent = "Hapus";
        removeButton.setAttribute("aria-label", `Hapus lampiran ${file.name}`);
        removeButton.addEventListener("click", () => {
          this.selectedFiles.splice(index, 1);
          this.renderFiles();
        });

        row.append(name, removeButton);
        this.fileList.append(row);
      });
    }

    formatFileSize(bytes) {
      if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  new NexgearSupportPage();
})();
