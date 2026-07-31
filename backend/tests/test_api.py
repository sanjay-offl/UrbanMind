def test_list_grievances_returns_list_with_total(client):
    response = client.get("/api/v1/grievances")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["items"]) == 5
    assert "ward_name" in data["items"][0]


def test_list_grievances_filters_and_sorts(client):
    response = client.get("/api/v1/grievances", params={"status": "pending", "sort_by": "score desc"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Deep pothole on Begumpet main road"


def test_get_grievance_by_id(client):
    found = client.get("/api/v1/grievances/1")
    assert found.status_code == 200
    assert found.json()["id"] == 1
    missing = client.get("/api/v1/grievances/999")
    assert missing.status_code == 404


def test_patch_grievance_updates_status(client):
    response = client.patch("/api/v1/grievances/1", json={"status": "in_progress"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "in_progress"
    assert body["updated_at"] is not None


def test_upload_csv_inserts_grievances(client):
    csv_bytes = (
        b"title,description,ward_name,latitude,longitude\n"
        b"No water supply,Water cut in the colony since morning,Begumpet,17.4493,78.4740\n"
    )
    response = client.post(
        "/api/v1/upload", files={"file": ("grievances.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["inserted"] == 1
    assert body["errors"] == []


def test_upload_csv_rejects_non_csv(client):
    response = client.post(
        "/api/v1/upload", files={"file": ("notes.txt", b"hello", "text/plain")}
    )
    assert response.status_code == 400


def test_upload_csv_unknown_ward_reports_error(client):
    csv_bytes = b"title,description,ward_name\nTest complaint,Some description,NonexistentWard\n"
    response = client.post(
        "/api/v1/upload", files={"file": ("bad.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["inserted"] == 0
    assert any("Ward not found" in error for error in body["errors"])


def test_analytics_summary_returns_kpi_keys(client):
    response = client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert set(data.keys()) == {"kpis", "categories", "wards", "trends"}
    assert set(data["kpis"].keys()) == {"total", "open", "critical", "avg_score"}
    assert data["kpis"]["total"] == 5


def test_delete_grievance(client):
    response = client.delete("/api/v1/grievances/1")
    assert response.status_code == 200
    assert response.json()["deleted"] == 1
    assert client.get("/api/v1/grievances/1").status_code == 404
