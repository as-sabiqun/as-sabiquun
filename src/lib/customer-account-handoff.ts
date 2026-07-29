export function shouldResumeCheckout(resumeCheckout: boolean | undefined, search: string) {
  return resumeCheckout === true && new URLSearchParams(search).get("resume") === "checkout";
}
