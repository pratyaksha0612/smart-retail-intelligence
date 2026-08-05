import os
import sys
import win32com.client

def convert_to_pdf(docx_path, pdf_path):
    word = win32com.client.Dispatch("Word.Application")
    word.visible = False
    try:
        doc = word.Documents.Open(docx_path)
        doc.SaveAs(pdf_path, FileFormat=17)
        doc.Close()
    except Exception as e:
        print(f"Failed to convert: {e}")
    finally:
        word.Quit()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_to_pdf.py <docx_path> <pdf_path>")
        sys.exit(1)
        
    docx_file = os.path.abspath(sys.argv[1])
    pdf_file = os.path.abspath(sys.argv[2])
    
    print(f"Converting {docx_file} to {pdf_file}...")
    convert_to_pdf(docx_file, pdf_file)
    print("Done!")
