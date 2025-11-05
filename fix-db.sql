-- Manually add the templateName column as nullable
ALTER TABLE "FlowResponse" ADD COLUMN IF NOT EXISTS "templateName" TEXT;

-- Create the index
CREATE INDEX IF NOT EXISTS "FlowResponse_templateName_createdAt_idx" ON "FlowResponse"("templateName", "createdAt");