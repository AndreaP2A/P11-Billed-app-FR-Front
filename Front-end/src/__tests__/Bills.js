/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

////// Tâche 3 [Tests unitaires et d’intégration]
// Appui sur le mock de l'API
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      ////// Tâche 3  [Tests unitaires et d’intégration]
      // to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon");
    });

    // Intégration : GET / Rendu de la liste des notes de frais
    test("the bills are fetched from the (mock) API and displayed", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const billsList = screen.getByTestId("tbody");
      expect(billsList).toBeTruthy();
    });

    test("Then bills should be ordered from most recent to oldest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Unitaire : Rendu du formulaire d'ajout en cliquant sur "nouvelle note de frais"
    describe("When I click on the New Bill button", () => {
      test("It should open the New Bill page", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });

        const btnNewBill = await screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn(
          () => billsContainer.handleClickNewBill
        );
        btnNewBill.addEventListener("click", handleClickNewBill);

        userEvent.click(btnNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });
    // Unitaire : Rendu de la modale (justificatif) en cliquant sur l'icone oeil
    describe("When I click on the eye icon of a bill", () => {
      test("It should open the modal with the bill's justification (img)", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });

        const handleClickIconEye = jest.fn((icon) =>
          billsContainer.handleClickIconEye(icon)
        );
        const iconEye = await screen.getAllByTestId("icon-eye");
        const modaleFile = document.getElementById("modaleFile");

        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

        iconEye.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye(icon));
          userEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
        });

        expect(modaleFile).toBeTruthy();
        expect(modaleFile.classList).toContain("show");
      });
    });

    // Integration : Gestion d'erreur API (404/Not Found & 500/Server Error)
    describe("When an error occurs on API", () => {
      // Clean up de l'environnement de test avant de tester les erreurs
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "e@e" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("Then it should display a 404 error message when fetching bills", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 404")),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() =>
          expect(screen.getByText(/Erreur 404/)).toBeTruthy()
        );
      });

      test("Then it should display a 500 error message when fetching bills", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => Promise.reject(new Error("Erreur 500")),
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() =>
          expect(screen.getByText(/Erreur 500/)).toBeTruthy()
        );
      });
    });
  });
});
