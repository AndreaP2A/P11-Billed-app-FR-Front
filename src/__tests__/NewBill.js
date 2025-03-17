/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";

////// Tâche 3 [Tests unitaires et d’intégration]
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Intégration : Navigation sur NewBill et bonne icone active/UI
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon).toHaveClass("active-icon");
    });

    describe("When I fill the form", () => {
      let newBill, bill;

      beforeEach(async () => {
        document.body.innerHTML = NewBillUI();
        newBill = new NewBill({
          document,
          onNavigate: (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          },
          store: mockStore,
          localStorage: localStorageMock,
        });

        const bills = await mockStore.bills().list();
        bill = bills[1];
      });
      // Unitaire : test des inputs et validation
      test("Then the form fields are correctly filled", () => {
        const typeField = screen.getByTestId("expense-type");
        fireEvent.change(typeField, { target: { value: bill.type } });
        expect(typeField.value).toBe(bill.type);

        const nameField = screen.getByTestId("expense-name");
        fireEvent.change(nameField, { target: { value: bill.name } });
        expect(nameField.value).toBe(bill.name);

        const dateField = screen.getByTestId("datepicker");
        fireEvent.change(dateField, { target: { value: bill.date } });
        expect(dateField.value).toBe(bill.date);

        const amountField = screen.getByTestId("amount");
        fireEvent.change(amountField, { target: { value: bill.amount } });
        expect(parseInt(amountField.value)).toBe(parseInt(bill.amount));

        const vatField = screen.getByTestId("vat");
        fireEvent.change(vatField, { target: { value: bill.vat } });
        expect(parseInt(vatField.value)).toBe(parseInt(bill.vat));

        const pctField = screen.getByTestId("pct");
        fireEvent.change(pctField, { target: { value: bill.pct } });
        expect(parseInt(pctField.value)).toBe(parseInt(bill.pct));

        const commentaryField = screen.getByTestId("commentary");
        fireEvent.change(commentaryField, {
          target: { value: bill.commentary },
        });
        expect(commentaryField.value).toBe(bill.commentary);
      });

      // Unitaire : test l'upload d'un fichier conforme (jpeg/png/jpg)
      test("Then a valid file is uploaded", () => {
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const fileField = screen.getByTestId("file");

        fileField.addEventListener("change", handleChangeFile);

        // Fichier invalide
        fireEvent.change(fileField, {
          target: {
            files: [
              new File(["file"], "file.pdf", { type: "application/pdf" }),
            ],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileField.value).toBe("");

        // Fichier valide
        fireEvent.change(fileField, {
          target: {
            files: [
              new File([bill.fileName], bill.fileUrl, { type: "image/jpeg" }),
            ],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileField.files[0].name).toBe(bill.fileUrl);
        expect(fileField.files[0].type).toBe("image/jpeg");
      });

      // Intégration : POST
      test("Then the form is submitted and a new bill is created", async () => {
        const handleSubmit = jest.fn(newBill.handleSubmit);
        newBill.updateBill = jest.fn();
        const submitBtn = screen.getByTestId("form-new-bill");

        submitBtn.addEventListener("submit", handleSubmit);

        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: jest
              .fn()
              .mockReturnValue(JSON.stringify({ email: "a@a" })),
          },
          writable: true,
        });

        const file = new File(["file content"], bill.fileName, {
          type: "image/jpeg",
        });
        newBill.file = file;
        newBill.fileName = bill.fileName;

        fireEvent.submit(submitBtn);

        expect(handleSubmit).toHaveBeenCalled();

        newBill.store.bills().create = jest.fn().mockResolvedValue({
          fileUrl: bill.fileUrl,
          key: bill.id,
        });

        const appendSpy = jest.spyOn(FormData.prototype, "append");

        await newBill.handleSubmit({
          preventDefault: jest.fn(),
          target: {
            querySelector: (selector) => {
              switch (selector) {
                case `input[data-testid="datepicker"]`:
                  return { value: bill.date };
                case `select[data-testid="expense-type"]`:
                  return { value: bill.type };
                case `input[data-testid="expense-name"]`:
                  return { value: bill.name };
                case `input[data-testid="amount"]`:
                  return { value: bill.amount };
                case `input[data-testid="vat"]`:
                  return { value: bill.vat };
                case `input[data-testid="pct"]`:
                  return { value: bill.pct };
                case `textarea[data-testid="commentary"]`:
                  return { value: bill.commentary };
                case `input[data-testid="file"]`:
                  return {
                    files: [
                      new File([bill.fileName], bill.fileUrl, {
                        type: "image/jpeg",
                      }),
                    ],
                  };
                default:
                  return null;
              }
            },
          },
        });

        expect(newBill.updateBill).toHaveBeenCalled();

        expect(appendSpy).toHaveBeenCalledWith("file", expect.any(File));
        expect(appendSpy).toHaveBeenCalledWith("email", bill.email);

        await waitFor(() => {
          expect(newBill.fileUrl).toBe(bill.fileUrl);
          expect(newBill.billId).toBe(bill.id);
        });

        await waitFor(() => {
          expect(screen.getByTestId("icon-mail")).toBeTruthy();
        });
      });
    });
  });
});
