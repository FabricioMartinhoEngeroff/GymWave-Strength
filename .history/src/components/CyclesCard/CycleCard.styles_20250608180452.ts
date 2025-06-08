import styled from "styled-components";

export const CardContainer = styled.section`
  width: 100vw; /* Força o preenchimento da tela */
  max-width: 100%;
  margin: 0;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 2px 16px rgba(0, 102, 204, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    border-radius: 0;
    box-shadow: none;
    padding: 16px 12px;
  }
`;

export const TituloPrincipal = styled.h2`
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  color: #0d47a1;
`;

export const Bloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  label,
  p {
    font-weight: 600;
    color: #0d47a1;
    font-size: 14px;
    margin-bottom: 4px;
  }

  input,
  select {
    border-radius: 8px;
    border: 1px solid #ccc;
    padding: 10px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }
`;

export const ObservationsField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  textarea,
  input {
    border-radius: 8px;
    border: 1px solid #ccc;
    padding: 10px;
    font-size: 14px;
    width: 100%;
    resize: vertical;
    box-sizing: border-box;
  }
`;

export const ButtonRow = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  button {
    width: 100%;
    font-size: 16px;
    padding: 10px;
    border-radius: 8px;
    box-sizing: border-box;
  }
`;

export const MensagemMotivacional = styled.div`
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #0d47a1;
  font-weight: 500;
  line-height: 1.5;
`;
