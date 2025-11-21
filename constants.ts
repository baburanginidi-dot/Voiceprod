
import { Stage } from './types';

export const PCM_WORKLET_PROCESSOR_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const float32Data = input[0];
      // Post the raw float32 data to the main thread
      this.port.postMessage(float32Data);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export const STAGES: Stage[] = [
  {
    id: 1,
    order_index: 1,
    title: "Greeting & Identity",
    system_instruction: "Verify identity. Warmly welcome the user to NxtWave.",
    validation_criteria: "User confirms name and student ID.",
    cta_label: "Verify",
    cta_url: "#",
  },
  {
    id: 2,
    order_index: 2,
    title: "Need & Program Fit",
    system_instruction: "Discuss the CCBP 4.0 program benefits. Ensure user understands the career outcome.",
    validation_criteria: "User acknowledges program value.",
    cta_label: "View Syllabus",
    cta_url: "#",
  },
  {
    id: 3,
    order_index: 3,
    title: "Payment Options",
    system_instruction: "Present Full Payment vs EMI options. Explain the 5% discount for full payment.",
    validation_criteria: "User selects a payment method.",
    cta_label: "View Plans",
    cta_url: "#",
  },
  {
    id: 4,
    order_index: 4,
    title: "NBFC / Loan Offer",
    system_instruction: "If EMI selected: Collect employment details for loan approval. Explain interest rates.",
    validation_criteria: "User agrees to credit check or selects lender.",
    cta_label: "Check Eligibility",
    cta_url: "#",
  },
  {
    id: 5,
    order_index: 5,
    title: "KYC Verification",
    system_instruction: "Ask user to upload Aadhaar/PAN. Verify details verbally.",
    validation_criteria: "Documents uploaded and verified.",
    cta_label: "Upload Docs",
    cta_url: "#",
  },
  {
    id: 6,
    order_index: 6,
    title: "Confirmation",
    system_instruction: "Confirm the final amount and transaction date. Get explicit consent.",
    validation_criteria: "User says 'Yes' to charge.",
    cta_label: "Confirm",
    cta_url: "#",
  },
  {
    id: 7,
    order_index: 7,
    title: "Onboarding Complete",
    system_instruction: "Congratulations. Provide LMS login details.",
    validation_criteria: "Final farewell.",
    cta_label: "Go to LMS",
    cta_url: "#",
  }
];
