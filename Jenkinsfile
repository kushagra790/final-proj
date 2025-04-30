pipeline {
    agent any

    environment {
        IMAGE_NAME = "kushagra7905/smart-fit"
        TAG = "latest"
        REMOTE_USER = "ubuntu"
        REMOTE_HOST = "3.110.185.103"
        CONTAINER_NAME = "smart-fit-app"
        DOCKER_PORT = "3000"
    }

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/kushagra790/final-proj.git', branch: 'main'
            }
        }

        stage('Build Docker Image') {
            steps {
                withCredentials([file(credentialsId: 'smartfit-dotenv', variable: 'DOTENV_FILE')]) {
                    sh '''
                        cp "$DOTENV_FILE" .env.local
                        docker build -t ${IMAGE_NAME}:${TAG} .
                        rm .env.local
                    '''
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')
                ]) {
                    sh '''
                        echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                        docker push ${IMAGE_NAME}:${TAG}
                    '''
                }
            }
        }

        stage('Deploy on EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'EC2_KEY')]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no -i "$EC2_KEY" ${REMOTE_USER}@${REMOTE_HOST} \\
                        "docker pull ${IMAGE_NAME}:${TAG} && \\
                        docker stop ${CONTAINER_NAME} || true && \\
                        docker rm ${CONTAINER_NAME} || true && \\
                        docker run -d -p ${DOCKER_PORT}:3000 --name ${CONTAINER_NAME} ${IMAGE_NAME}:${TAG}"
                    """
                }
            }
        }
    }
}
