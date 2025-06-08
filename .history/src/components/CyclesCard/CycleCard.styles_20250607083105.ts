import styled from "styled-components";

export const CardContainer = styled.section`
  width: 100%;
  max-width: 380px;
  margin: 0 auto 20px;
  padding: 16px;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(33, 150, 243, 0.1);
  border: 1px solid #e0f2f1;

  display: flex;
  flex-direction: column;
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
`;

export const SelectorRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;

  select {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background-color: #f8f8f8;
    font-size: 14px;
  }
`;

export const ObservationsField = styled.div`
  margin-top: 12px;
`;

export const ButtonRow = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: center;
`;

export const LabelTitulo = styled.h2`
  font-size: 16px;
  font-weight: bold;
  color: #0d47a1;
  margin-bottom: 6px;
`;

export const SubLabel = styled.p`
  font-size: 13px;
  color: #455a64;
  margin-bottom: 10px;
`;

export const DateWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  input {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
    width: 120px;
  }
`;
