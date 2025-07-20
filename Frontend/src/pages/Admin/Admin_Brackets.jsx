import React, { useState } from "react";
import "../../style/Admin_BracketPage.css";

const BracketsPage = ({sidebarOpen}) => {


  const [formData, setFormData] = useState({
    bracketName: "",
    bracketType: "",
    sport: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.bracketName &&
      formData.bracketType &&
      formData.sport &&
      formData.description
    ) {
      alert("Bracket creation submitted (UI demo only)");
      setFormData({
        bracketName: "",
        bracketType: "",
        sport: "",
        description: "",
      });
    } else {
      alert("Please fill in all required fields.");
    }
  };

  
  return (
    <div className="admin-dashboard">
      

      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="dashboard-header">
          <h1>Brackets</h1>
          <p>Manage tournament brackets</p>
        </div>

        <div className="bracket-content">
          <div className="bracket-create-section">
            <div className="bracket-form-container">
              <h2>Create New Bracket</h2>
              <form className="bracket-form" onSubmit={handleSubmit}>

                <div className="bracket-form-row">

                  <div className="bracket-form-group">
                    <label htmlFor="bracketName">Bracket Name *</label>
                    <input
                      type="text"
                      id="bracketName"
                      name="bracketName"
                      value={formData.bracketName}
                      onChange={handleInputChange}
                      placeholder="Enter bracket name"
                      required
                    />
                  </div>

                  <div className="bracket-form-group">
                    <label htmlFor="bracketType">Bracket Type *</label>
                    <select
                      id="bracketType"
                      name="bracketType"
                      value={formData.bracketType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select bracket type</option>
                      <option value="single">Single Elimination</option>
                      <option value="double">Double Elimination</option>
                    </select>
                  </div>
                </div>

                <div className="bracket-form-row">
                  <div className="bracket-form-group">
                    <label htmlFor="sport">Sport *</label>
                    <select
                      id="sport"
                      name="sport"
                      value={formData.sport}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a sport</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Volleyball">Volleyball</option>
                    </select>
                  </div>
                </div>

                <div className="bracket-form-group">
                  <label htmlFor="description">Bracket Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter bracket description"
                    rows="5"
                    required
                  />
                </div>
                
                <div className="bracket-form-actions">
                  <button type="submit" className="bracket-submit-btn">
                    Create Bracket
                  </button>
                  
                  <button
                    type="button"
                    className="bracket-cancel-btn"
                    onClick={() =>
                      setFormData({
                        bracketName: "",
                        bracketType: "",
                        sport: "",
                        description: "",
                      })
                    }
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketsPage;