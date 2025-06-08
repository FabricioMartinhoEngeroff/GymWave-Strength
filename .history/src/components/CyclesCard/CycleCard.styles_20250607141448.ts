import styled from "styled-components";

export const CardContainer = styled.section`
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 102, 204, 0.1);
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const TituloPrincipal = styled.h2`
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  color: #0d47a1;
`;

export const Bloco = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ObservationsField = styled.div`
  margin-top: 10px;
`;

export const ButtonRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: center;
`;

export const MensagemMotivacional = styled.div`
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #0d47a1;
  font-weight: 500;
`;
