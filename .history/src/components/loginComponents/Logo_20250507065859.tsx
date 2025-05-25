import styled from "styled-components";
import logo from "../assets/logo.png"; 

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 20px;

  img {
    width: 180px;
  }
`;

export function Logo() {
  return (
    <LogoContainer>
      <img src={logo} alt="Logo BMEH" />
    </LogoContainer>
  );
}