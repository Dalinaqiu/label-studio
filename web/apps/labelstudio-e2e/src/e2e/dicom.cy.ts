const DICOM_SAMPLE_PATH = "/tmp/ls-dicom-smoke.dcm";

const getTaskList = (body: any) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.tasks)) return body.tasks;
  if (Array.isArray(body?.results)) return body.results;
  return [];
};

const getTaskDataUrl = (body: any) => {
  const data = body?.data ?? {};
  const stringValue = Object.values(data).find((value) => typeof value === "string");

  return stringValue as string | undefined;
};

describe("DICOM import, preview, and annotation", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", (error) => {
      if (error.message.includes("Cannot read properties of null (reading 'addEventListener')")) {
        return false;
      }
    });
  });

  it("uploads a DICOM file, renders the preview, and draws a region", () => {
    const email = `dicom-e2e-${Date.now()}@example.com`;
    const password = "Test123456!";
    const projectName = `DICOM Smoke ${Date.now()}`;

    cy.visit("/user/signup/");
    cy.get("#email").should("be.visible").type(email);
    cy.get("#password").type(password);
    cy.get("#signup-form").submit();

    cy.visit("/projects");
    cy.contains("button", "创建").click();

    cy.get("#project_name").should("be.visible").clear().type(projectName);
    cy.contains("标注设置").click();
    cy.contains("Object Detection with Bounding Boxes").click();

    cy.contains("数据导入").click();
    cy.get("#file-input").selectFile(DICOM_SAMPLE_PATH, { force: true });
    cy.contains("已上传 1 个文件").should("be.visible");

    cy.contains("button", "保存").click();
    cy.location("pathname", { timeout: 30000 }).should("match", /\/projects\/\d+\/data\/?$/);

    cy.location("pathname").then((pathname) => {
      const projectId = pathname.match(/\/projects\/(\d+)\/data\/?$/)?.[1];

      expect(projectId, "project id").to.exist;

      cy.request(`/api/tasks?project=${projectId}`).then(({ body }) => {
        const tasks = getTaskList(body);
        const taskId = tasks[0]?.id;

        expect(taskId, "imported task id").to.exist;

        cy.visit(`/projects/${projectId}/data?task=${taskId}&labeling=1`);

        cy.request(`/api/tasks/${taskId}?project=${projectId}`).then(({ body: taskBody }) => {
          const taskDataUrl = getTaskDataUrl(taskBody);

          expect(taskDataUrl, "task data url").to.exist;
          expect(taskDataUrl, "task data url").to.match(/dcm|dicom|filepath=/i);

          const previewUrl = taskDataUrl?.includes("?") ? `${taskDataUrl}&preview=1` : `${taskDataUrl}?preview=1`;

          cy.request(previewUrl as string).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.headers["content-type"]).to.include("image/png");
          });
        });

        cy.get(".lsf-label").contains("Airplane").click();
        cy.get(".lsf-label.lsf-label_selected").should("contain.text", "Airplane");

        cy.get(".konvajs-content")
          .should("be.visible")
          .trigger("mousedown", 40, 40, { eventConstructor: "MouseEvent", buttons: 1, force: true })
          .trigger("mousemove", 180, 180, { eventConstructor: "MouseEvent", buttons: 1, force: true })
          .trigger("mouseup", 180, 180, { eventConstructor: "MouseEvent", buttons: 1, force: true });

        cy.get(".lsf-outliner .lsf-tree__node:not(.lsf-tree__node_type_footer) .lsf-tree-node-content-wrapper").should(
          "have.length.at.least",
          1,
        );
      });
    });
  });
});
