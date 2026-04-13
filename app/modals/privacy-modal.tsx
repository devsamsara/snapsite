import React from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/button';
import { ModalRoot, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal-layout';
import {useColors} from "@/hooks/use-colors";

const PrivacyModal = () => {
  const router = useRouter();

  return (
    <ModalRoot>
      <ModalHeader
        title="Política de Privacidad"
        subtitle="Cómo protegemos tus datos"
        onClose={router.back}
      />
      <ModalBody>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>
          <Section title="1. Información que Recopilamos">
            Recopilamos información que proporcionas directamente, como tu nombre, correo
            electrónico, número de teléfono y datos de tu perfil. También recopilamos información
            sobre tu uso del servicio, incluyendo dirección IP, tipo de navegador y páginas
            visitadas.
          </Section>

          <Section title="2. Cómo Usamos tu Información">
            Utilizamos tu información para proporcionar, mejorar y personalizar nuestros servicios.
            También la usamos para comunicarnos contigo, procesar transacciones y cumplir con
            obligaciones legales.
          </Section>

          <Section title="3. Protección de Datos">
            Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tu
            información personal contra acceso no autorizado, alteración, divulgación o destrucción.
          </Section>

          <Section title="4. Compartir Información">
            No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto
            cuando sea necesario para proporcionar nuestros servicios o cuando sea requerido por
            ley.
          </Section>

          <Section title="5. Cookies y Tecnologías de Rastreo">
            Utilizamos cookies y tecnologías similares para mejorar tu experiencia. Puedes controlar
            las cookies a través de la configuración de tu navegador.
          </Section>

          <Section title="6. Tus Derechos">
            Tienes derecho a acceder, corregir o eliminar tu información personal. También puedes
            optar por no recibir comunicaciones de marketing. Contáctanos para ejercer estos
            derechos.
          </Section>

          <Section title="7. Retención de Datos">
            Retenemos tu información personal durante el tiempo que sea necesario para proporcionar
            nuestros servicios y cumplir con nuestras obligaciones legales. Puedes solicitar la
            eliminación de tus datos en cualquier momento.
          </Section>

          <Section title="8. Cambios en esta Política">
            Podemos actualizar esta política de privacidad periódicamente. Te notificaremos de
            cambios significativos por correo electrónico o mediante un aviso prominente en nuestro
            sitio.
          </Section>

          <Section title="9. Contacto">
            Si tienes preguntas sobre nuestra política de privacidad o cómo manejamos tus datos,
            contáctanos en privacy@fitconnect.com.
          </Section>

          <Section title="10. Cumplimiento Legal">
            Cumplimos con todas las leyes de protección de datos aplicables, incluyendo GDPR y otras
            regulaciones de privacidad internacionales.
          </Section>
        </ScrollView>
      </ModalBody>
      <ModalFooter>
        <Button title="Entendido" onPress={router.back} />
      </ModalFooter>
    </ModalRoot>
  );
};

interface SectionProps {
  title: string;
  children: string;
}

const Section = ({ title, children }: SectionProps) => {

  return (
    <View style={S.section}>
      <Text style={[S.sectionTitle, { color: '#11181C' }]}>{title}</Text>
      <Text style={[S.sectionText, { color: '#687076' }]}>{children}</Text>
    </View>
  );
};

export default PrivacyModal;

const S = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 24,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
