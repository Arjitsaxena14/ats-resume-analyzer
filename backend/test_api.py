import requests
import json

url = "http://127.0.0.1:5000/api/analyze"
file_path = "../dummy_resume.docx"

try:
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {
            'job_description': 'Looking for a Senior Python Developer. Must have experience with Flask, SQL database, Git, Docker containerization, AWS Cloud services. JavaScript/React is a plus.'
        }
        print("Sending upload request to backend with Job Description comparison...")
        response = requests.post(url, files=files, data=data)
        
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        res_data = response.json()
        print("Response received successfully!")
        print(f"Record ID: {res_data.get('id')}")
        print(f"Filename: {res_data.get('filename')}")
        
        analysis = res_data.get('analysis', {})
        print(f"Overall Score: {analysis.get('overall_score')}")
        print(f"ATS Score: {analysis.get('ats_score')}")
        print(f"Recruiter Decision: {analysis.get('recruiter_decision')}")
        
        print("\n--- Core Matrix Scores ---")
        print(f"Formatting Score: {analysis.get('formatting_score')}%")
        print(f"Structure Score: {analysis.get('structure_score')}%")
        print(f"Keyword Match Score: {analysis.get('keyword_match')}%")
        print(f"Skills Match Score: {analysis.get('skills_match')}%")
        print(f"Project Experience Score: {analysis.get('project_score')}%")
        print(f"Writing Score: {analysis.get('writing_score')}%")
        
        print(f"\nMissing Keywords: {analysis.get('missing_keywords')}")
        print(f"Missing Skills: {analysis.get('missing_skills')}")
        print(f"Strengths: {analysis.get('strengths')}")
        print(f"Weaknesses: {analysis.get('weaknesses')}")
    else:
        print("Error Response:")
        print(response.text)
except Exception as e:
    print(f"Failed to connect to API: {e}")
