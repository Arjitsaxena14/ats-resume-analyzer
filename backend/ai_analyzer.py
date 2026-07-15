import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure the API key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def analyze_resume_with_gemini(text_content, job_description=""):
    if not api_key:
        print("GEMINI_API_KEY not found. Using mock analysis.")
        return generate_mock_analysis(text_content, job_description)
        
    has_jd = bool(job_description and job_description.strip() != "")
    
    prompt = f"""
    You are NOT a resume assistant.
    You are an extremely strict ATS (Applicant Tracking System) and Senior Technical Recruiter with 20+ years of hiring experience.
    Your job is to REJECT resumes whenever appropriate.
    
    Never inflate scores.
    Never assume information that is not explicitly written.
    Never reward potential.
    Evaluate ONLY what exists in the resume.
    
    RULES FOR SCORING ACCURACY:
    - Average student resumes MUST score between 55-75.
    - Good engineering resumes should score 75-85.
    - Excellent resumes should score 85-90.
    - 90+ should be EXTREMELY RARE and reserved for candidates that are top-tier.
    - NEVER give a score of 95+ unless the resume is genuinely flawless and exceptional.
    - If there are weaknesses, missing keywords, or generic bullet points, deduct marks heavily.
    
    IMPORTANT - JOB DESCRIPTION ALIGNMENT:
    - A Job Description (JD) {"IS" if has_jd else "IS NOT"} provided.
    - {"CRITICAL: Because a JD is provided, you must prioritize job matching relevance. The final overall_score and ats_score MUST be heavily bound to the keyword_match and skills_match against this JD. If the keyword match is below 50%, the overall_score MUST be capped below 60% (Reject). If it lacks core required JD technologies, it cannot get a passing shortlist grade." if has_jd else "Since no JD is provided, evaluate general profile structure and industry-standard technical keywords."}
    
    Evaluate the resume using these categories:
    1. ATS Formatting (15% weight)
       - Standard headings, Single-column layout, Readable fonts, No tables/images, Contact information
    2. Resume Structure (15% weight)
       - Summary, Education, Experience, Projects, Skills, Certifications
    3. Keyword Match (25% weight)
       - Compare the resume against the provided job description.
       - Measure: Exact keyword match, Missing keywords, Keyword coverage percentage.
       - If no job description is provided, grade it generally against standard technical profiles.
    4. Skills Match (20% weight)
       - Technical skills, Frameworks, Tools, Soft skills. (Do NOT infer skills).
    5. Experience & Projects (15% weight)
       - Relevance, Complexity, Technologies used, Quantifiable impact, Action verbs
    6. Writing Quality (10% weight)
       - Grammar, Readability, Professional tone, Conciseness
       
    Scoring Guide:
    95-100: Exceptional, recruiter-ready
    90-94: Excellent
    80-89: Strong
    70-79: Good
    60-69: Needs improvement
    Below 60: Weak
    
    Return ONLY valid JSON in the following format:
    {{
      "overall_score": 0, // Weighted average score (0-100)
      "ats_score": 0, // Readability and scan score (0-100)
      "keyword_match": 0, // match percentage out of 100
      "skills_match": 0, // match percentage out of 100
      "formatting_score": 0, // formatting score out of 100
      "structure_score": 0, // structure score out of 100
      "writing_score": 0, // writing score out of 100
      "project_score": 0, // experience and project score out of 100
      "missing_keywords": ["Keyword 1", "Keyword 2"],
      "missing_skills": ["Skill 1", "Skill 2"],
      "strengths": ["Strength detail 1", "Strength detail 2"],
      "weaknesses": ["Weakness detail 1", "Weakness detail 2"],
      "recommendations": ["Recommendation detail 1", "Recommendation detail 2"],
      "summary": "Strict, recruiter perspective final summary paragraph explaining formatting structure and JD compatibility gaps.",
      "recruiter_decision": "Reject | Maybe | Shortlist"
    }}
    
    Do not include markdown blocks.
    Do not include explanations outside the JSON.
    Return valid JSON only.
    
    Resume text:
    \"\"\"{text_content}\"\"\"
    
    Job Description:
    \"\"\"{job_description if job_description else "Evaluate candidate generally for a Standard Full-Stack Software Developer role."}\"\"\"
    """
    
    try:
        try:
            model = genai.GenerativeModel(
                'gemini-1.5-flash',
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(prompt)
            result = json.loads(response.text)
            return result
        except Exception as inner_e:
            print(f"Failed to use gemini-1.5-flash with JSON mode: {inner_e}. Trying fallback mode.")
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            result = json.loads(text)
            return result
    except Exception as e:
        print(f"Gemini API analysis failed: {e}. Falling back to mock analysis.")
        return generate_mock_analysis(text_content, job_description)

def generate_mock_analysis(text_content, job_description=""):
    text_lower = text_content.lower()
    has_jd = bool(job_description and job_description.strip() != "")
    
    # 1. ATS Formatting (15% weight)
    fmt_score = 100
    headers = ["education", "experience", "work", "projects", "skills"]
    headers_found = [h for h in headers if h in text_lower]
    if len(headers_found) < 5:
        fmt_score -= (5 - len(headers_found)) * 12
    if "email" not in text_lower and "@" not in text_lower:
        fmt_score -= 15
    if "phone" not in text_lower and not re.search(r'\+?\d[\d -]{8,12}\d', text_content):
        fmt_score -= 10
    fmt_score = max(fmt_score, 30)
    
    # 2. Resume Structure (15% weight)
    struct_score = 100
    if "summary" not in text_lower and "profile" not in text_lower:
        struct_score -= 15
    if "education" not in text_lower:
        struct_score -= 20
    if "experience" not in text_lower and "work" not in text_lower:
        struct_score -= 25
    if "projects" not in text_lower:
        struct_score -= 20
    if "skills" not in text_lower:
        struct_score -= 20
    if "certifications" not in text_lower and "awards" not in text_lower:
        struct_score -= 10
    struct_score = max(struct_score, 20)
    
    # 3. Keyword Match (25% weight)
    all_tech = ["python", "javascript", "react", "flask", "django", "node", "sql", "sqlite", "postgres", "docker", "kubernetes", "aws", "gcp", "azure", "git", "github", "html", "css"]
    tech_found = [t.capitalize() for t in all_tech if t in text_lower]
    
    jd_req = []
    if has_jd:
        jd_lower = job_description.lower()
        jd_req = [t for t in all_tech if t in jd_lower]
        
    if not jd_req:
        # Default expectations if none supplied
        jd_req = ["python", "javascript", "react", "flask", "sql", "git"]
        
    matching_kws = [kw.capitalize() for kw in jd_req if kw in text_lower]
    missing_kws = [kw.capitalize() for kw in jd_req if kw not in text_lower]
    
    kw_match = 0
    if len(jd_req) > 0:
        kw_match = int((len(matching_kws) / len(jd_req)) * 100)
    
    # 4. Skills Match (20% weight)
    skills_score = 40 + (len(tech_found) * 5)
    skills_score = min(skills_score, 88)
    
    # 5. Experience & Projects (15% weight)
    numbers = re.findall(r'\b\d+%?\b', text_content)
    metrics_count = len(numbers)
    
    proj_score = 45
    if metrics_count >= 4:
        proj_score += 20
    elif metrics_count >= 2:
        proj_score += 10
        
    action_verbs = ["developed", "implemented", "optimized", "managed", "designed", "built"]
    verbs_found = [v for v in action_verbs if v in text_lower]
    if len(verbs_found) >= 3:
        proj_score += 15
    elif len(verbs_found) >= 1:
        proj_score += 5
    proj_score = min(proj_score, 90)
    
    # 6. Writing Quality (10% weight)
    writing_score = 60
    if len(text_content.split()) > 150:
        writing_score += 20
    if not re.search(r'\b(innovative|synergy|scalable|passionate)\b', text_lower):
        writing_score += 10
    writing_score = min(writing_score, 90)
    
    # Weighted calculation
    if has_jd:
        # Job Description is uploaded: keyword alignment gets 40% weight, skills match 25%.
        # Formatting, Structure, Projects, Writing weights are scaled down.
        overall_score = int(
            (fmt_score * 0.10) + 
            (struct_score * 0.10) + 
            (kw_match * 0.40) + 
            (skills_score * 0.25) + 
            (proj_score * 0.10) + 
            (writing_score * 0.05)
        )
        # Apply strict thresholds on low keyword matching
        if kw_match < 40:
            overall_score = min(overall_score, 55)
        elif kw_match < 60:
            overall_score = min(overall_score, 70)
            
        ats_score = int((fmt_score * 0.3) + (struct_score * 0.3) + (kw_match * 0.4))
        ats_score = min(ats_score, 88)
    else:
        # Standard general scoring
        overall_score = int(
            (fmt_score * 0.15) + 
            (struct_score * 0.15) + 
            (kw_match * 0.25) + 
            (skills_score * 0.20) + 
            (proj_score * 0.15) + 
            (writing_score * 0.10)
        )
        overall_score = min(overall_score, 88)
        ats_score = int((fmt_score * 0.4) + (struct_score * 0.4) + (kw_match * 0.2))
        ats_score = min(ats_score, 88)
    
    recruiter_decision = "Reject"
    if overall_score >= 78:
        recruiter_decision = "Shortlist"
    elif overall_score >= 58:
        recruiter_decision = "Maybe"
        
    strengths = []
    weaknesses = []
    recommendations = []
    
    if fmt_score >= 80: 
        strengths.append("Standard headings and structural compatibility detected.")
    else: 
        weaknesses.append("Non-standard layout headers causing parsing index discrepancies.")
        recommendations.append("Standardize your section headings to match standard recruiter systems (e.g. use 'Experience' instead of 'Where I've Been').")
    
    if metrics_count >= 3: 
        strengths.append("Strong focus on outcomes using quantifiable data matrices.")
    else:
        weaknesses.append("Lack of quantifiable results; bullets represent daily tasks rather than direct business outcomes.")
        recommendations.append("Incorporate quantitative metrics (e.g. efficiency percentages, database load decreases) in experience bullet points.")
        
    if kw_match >= 70: 
        strengths.append("High keyword coverage against the target profile requirements.")
    else:
        weaknesses.append("Significant technical keywords gap, decreasing database selection relevance.")
        recommendations.append(f"Incorporate missing keywords relevant to the JD: {', '.join(missing_kws[:3])}.")
        
    if not strengths:
        strengths = ["Logical layout structure enabling parsing layout."]
        
    return {
        "overall_score": overall_score,
        "ats_score": ats_score,
        "keyword_match": kw_match,
        "skills_match": skills_score,
        "formatting_score": fmt_score,
        "structure_score": struct_score,
        "writing_score": writing_score,
        "project_score": proj_score,
        "missing_keywords": missing_kws,
        "missing_skills": missing_kws,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "summary": f"Evidence-based analysis completed with overall evaluation score of {overall_score}%. The candidate demonstrates standard formatting structure, but shows missing core technologies relevant to the JD. Optimizing keyword match, active verb structures, and metric indicators is recommended.",
        "recruiter_decision": recruiter_decision
    }
