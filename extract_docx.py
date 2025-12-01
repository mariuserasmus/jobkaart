import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file without external dependencies"""
    text = []

    try:
        with zipfile.ZipFile(docx_path, 'r') as docx:
            # Read the main document XML
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)

            # Namespace for Word documents
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            # Extract text from all text elements
            for paragraph in root.findall('.//w:p', ns):
                para_text = []
                for text_elem in paragraph.findall('.//w:t', ns):
                    if text_elem.text:
                        para_text.append(text_elem.text)
                if para_text:
                    text.append(''.join(para_text))

            return '\n'.join(text)
    except Exception as e:
        return f"Error extracting text: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract_docx.py <docx_file> <output_file>")
        sys.exit(1)

    docx_file = sys.argv[1]
    output_file = sys.argv[2]
    content = extract_text_from_docx(docx_file)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
