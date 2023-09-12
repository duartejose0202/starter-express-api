-- AlterTable
ALTER TABLE form_settings 
ADD COLUMN "form_styles_id" UUID,
ADD CONSTRAINT FK_form_settings_form_styles FOREIGN KEY (form_styles_id) REFERENCES form_styles(id);