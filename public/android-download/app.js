const pageConfig = window.APK_DOWNLOAD_CONFIG;

const statusElement = document.querySelector("[data-role='status']");
const titleElement = document.querySelector("[data-role='title']");
const descriptionElement = document.querySelector("[data-role='description']");
const versionElement = document.querySelector("[data-role='version']");
const publishedAtElement = document.querySelector("[data-role='published-at']");
const fileSizeElement = document.querySelector("[data-role='file-size']");
const notesElement = document.querySelector("[data-role='notes']");
const emptyStateElement = document.querySelector("[data-role='empty-state']");
const infoGridElement = document.querySelector("[data-role='info-grid']");
const installStepsElement = document.querySelector("[data-role='install-steps']");
const primaryDownloadLink = document.querySelector("[data-role='primary-download']");
const manualDownloadLink = document.querySelector("[data-role='manual-download']");
const retryButton = document.querySelector("[data-role='retry']");

const releaseApiUrl = [
  "https://api.github.com/repos",
  pageConfig.repositoryOwner,
  pageConfig.repositoryName,
  "releases/tags",
  pageConfig.releaseTag,
].join("/");

const fallbackReleaseUrl = [
  "https://github.com",
  pageConfig.repositoryOwner,
  pageConfig.repositoryName,
  "releases/tag",
  pageConfig.releaseTag,
].join("/");

const releaseDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function setStatus(message, variant) {
  statusElement.textContent = message;
  statusElement.dataset.variant = variant;
}

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes <= 0) {
    return "-";
  }

  const sizeUnits = ["B", "KB", "MB", "GB"];
  let currentValue = bytes;
  let currentUnitIndex = 0;

  while (currentValue >= 1024 && currentUnitIndex < sizeUnits.length - 1) {
    currentValue /= 1024;
    currentUnitIndex += 1;
  }

  return `${currentValue.toFixed(currentUnitIndex === 0 ? 0 : 1)} ${sizeUnits[currentUnitIndex]}`;
}

function toggleContentVisibility(isVisible) {
  emptyStateElement.hidden = isVisible;
  infoGridElement.hidden = !isVisible;
  installStepsElement.hidden = !isVisible;
  primaryDownloadLink.hidden = !isVisible;
}

function populateInstallSteps() {
  installStepsElement.innerHTML = "";

  pageConfig.installSteps.forEach((step) => {
    const listItem = document.createElement("li");
    listItem.textContent = step;
    installStepsElement.appendChild(listItem);
  });
}

function populateRelease(release, asset) {
  titleElement.textContent = pageConfig.pageTitle;
  descriptionElement.textContent = pageConfig.pageDescription;
  versionElement.textContent = release.name || release.tag_name || pageConfig.releaseTag;
  publishedAtElement.textContent = release.published_at
    ? releaseDateFormatter.format(new Date(release.published_at))
    : "-";
  fileSizeElement.textContent = formatFileSize(asset.size);
  notesElement.textContent = release.body?.trim() || "-";

  primaryDownloadLink.href = asset.browser_download_url;
  primaryDownloadLink.download = asset.name;
  manualDownloadLink.href = release.html_url || fallbackReleaseUrl;

  toggleContentVisibility(true);
  setStatus(pageConfig.messages.ready, "success");
}

async function loadRelease() {
  toggleContentVisibility(false);
  setStatus(pageConfig.messages.loading, "loading");

  try {
    const response = await fetch(releaseApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (response.status === 404) {
      setStatus(pageConfig.messages.missing, "warning");
      notesElement.textContent = "-";
      manualDownloadLink.href = fallbackReleaseUrl;
      return;
    }

    if (!response.ok) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    const release = await response.json();
    const apkAsset =
      release.assets?.find((asset) => asset.name === pageConfig.assetName) ??
      release.assets?.find((asset) => asset.name?.endsWith(".apk"));

    if (!apkAsset) {
      setStatus(pageConfig.messages.missing, "warning");
      notesElement.textContent = release.body?.trim() || "-";
      manualDownloadLink.href = release.html_url || fallbackReleaseUrl;
      return;
    }

    populateRelease(release, apkAsset);
  } catch (error) {
    console.error("Failed to load APK release.", error);
    setStatus(pageConfig.messages.failed, "error");
    notesElement.textContent = "-";
    manualDownloadLink.href = fallbackReleaseUrl;
  }
}

retryButton.addEventListener("click", () => {
  void loadRelease();
});

primaryDownloadLink.textContent = pageConfig.messages.primaryDownload;
manualDownloadLink.textContent = pageConfig.messages.manualDownload;
retryButton.textContent = pageConfig.messages.retry;

document.querySelector("[data-role='version-label']").textContent = pageConfig.messages.versionLabel;
document.querySelector("[data-role='published-at-label']").textContent =
  pageConfig.messages.publishedAtLabel;
document.querySelector("[data-role='file-size-label']").textContent = pageConfig.messages.fileSizeLabel;
document.querySelector("[data-role='notes-label']").textContent = pageConfig.messages.notesLabel;
document.querySelector("[data-role='install-guide-label']").textContent =
  pageConfig.messages.installGuideLabel;

populateInstallSteps();
manualDownloadLink.href = fallbackReleaseUrl;

void loadRelease();
