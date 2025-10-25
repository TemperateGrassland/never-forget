-- Sample FlowResponse data for testing visualizations
INSERT INTO "FlowResponse" (id, "flowToken", "flowName", "phoneNumber", responses, metadata, "createdAt") VALUES
-- Ease Feedback Responses
('test1', 'ease_feedback', 'ease_feedback', '+1234567890', 
 '{"selected_answer": "Very Easy", "comment": "Love it!"}', 
 '{"templateName": "ease_feedback", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '1 day'),

('test2', 'ease_feedback', 'ease_feedback', '+1234567891', 
 '{"selected_answer": "Easy", "comment": "Pretty good"}', 
 '{"templateName": "ease_feedback", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '2 days'),

('test3', 'ease_feedback', 'ease_feedback', '+1234567892', 
 '{"selected_answer": "Neutral"}', 
 '{"templateName": "ease_feedback", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '3 days'),

-- Satisfaction Survey Responses  
('test4', 'satisfaction_survey', 'satisfaction_survey', '+1234567893', 
 '{"selected_answer": "Very Satisfied", "comment": "Excellent app!"}', 
 '{"templateName": "satisfaction_survey", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '1 day'),

('test5', 'satisfaction_survey', 'satisfaction_survey', '+1234567894', 
 '{"selected_answer": "Satisfied"}', 
 '{"templateName": "satisfaction_survey", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '2 days'),

-- Feature Feedback Responses
('test6', 'feature_feedback', 'feature_feedback', '+1234567895', 
 '{"selected_answer": "Dark Mode", "comment": "Please add dark mode!"}', 
 '{"templateName": "feature_feedback", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '1 day'),

('test7', 'feature_feedback', 'feature_feedback', '+1234567896', 
 '{"selected_answer": "Calendar Integration"}', 
 '{"templateName": "feature_feedback", "messageType": "whatsapp_flow"}', 
 NOW() - INTERVAL '2 days');